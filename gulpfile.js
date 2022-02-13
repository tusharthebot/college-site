/**
 * Configuration JSON file
 */
var manifestLocation = './manifest.json';

/**
 * Gulp modules
 */
var argv = require('minimist')(process.argv.slice(2));
var autoprefixer = require('gulp-autoprefixer');
var browserSync = require('browser-sync').create();
var changed = require('gulp-changed');
var concat = require('gulp-concat');
var flatten = require('gulp-flatten');
var gulp = require('gulp');
var gutil = require('gulp-util');
var print = require('gulp-print');
var gulpif = require('gulp-if');
var imagemin = require('gulp-imagemin');
var sort = require('sort-stream');
var jshint = require('gulp-jshint');
var lazypipe = require('lazypipe');
var less = require('gulp-less');
var merge = require('merge-stream');
var cssNano = require('gulp-cssnano');
var plumber = require('gulp-plumber');
var rev = require('gulp-rev');
var runSequence = require('run-sequence');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var postcss = require('gulp-postcss');
var addsrc = require('gulp-add-src');
var gap = require('gulp-append-prepend');
var color = require('gulp-color');
const babel = require('gulp-babel');

/**
 * Notice for user
 */
const noticeEnabled = true;
if (noticeEnabled) {
  console.log('*******************************************************');
  console.log('* Tushar Local Setup Guide available here:        *');
  console.log('* If you have any issues, run these commands:         *');
  console.log('*   npm i -g npm    (until version stays the same)    *');
  console.log('*   npm ci                                            *');
  console.log('* If you still have issues, try this:                 *');
  console.log('*   rm -rf node_modules                               *');
  console.log('*   npm install                                       *');
  console.log('* This is known to work with gulp 3.9.1 on npm 5.5.1  *');
  console.log('*******************************************************');
  console.log('You can run ' + color('gulp -T', 'GREEN') + ' for a list of available gulp commands');
}

/**
 * Core Gulp variables
 */
var manifest = require('asset-builder-nobower')(manifestLocation);
var path = manifest.paths; // Paths to folders like source and dist
var config = manifest.config || {}; // Custom config from manifest
var globs = manifest.globs; // Globs for all assets (ex: js, css, fonts...)
var project = manifest.getProjectGlobs(); // Paths to assets
var revManifest = path.dist + 'manifest.json'; // Path to compiled assets
                                               // manifest

/**
 * CLI options
 */
var enabled = {
  // Enable static asset revisioning when `--production`
  rev: argv.production,
  // Disable source maps when `--production`
  maps: !argv.production,
  //maps: false,
  // Fail styles task on error when `--production`
  failStyleTask: argv.production,
  // Fail due to JSHint warnings only when `--production`
  //failJSHint: argv.production,
  // Strip debug statments from javascript when `--production`
  stripJSDebug: argv.production
};

/**
 * Error checking
 *
 * Produce an error rather than crashing
 */
var onError = function (err) {
  console.log(err.toString());
  this.emit('end');
};

/**
 * Style processing pipeline (reusable)
 *
 * Used to process style assets into compiled assets
 */
var cssPipeline = function (filename) {
  return lazypipe()
      .pipe(function () {
        return gulpif(!enabled.failStyleTask, plumber());
      })
      .pipe(function () {
        return gulpif(enabled.maps, sourcemaps.init());
      })
      .pipe(function () {
        return gulpif('*.less', less());
      })
      .pipe(function () {
        return gulpif('*.scss', sass({
          outputStyle: 'nested',
          precision: 10,
          includePaths: ['.', path.source],
          errLogToConsole: !enabled.failStyleTask
        }));
      })
      .pipe(concat, filename)
      .pipe(autoprefixer, {
        browsers: [
          'last 2 versions',
          'android 4',
          'opera 12'
        ]
      })
      .pipe(postcss, [require('postcss-object-fit-images')])
      .pipe(function () {
        return gulpif(config.minify, cssNano({
          safe: true
        }));
      })
      .pipe(function () {
        return gulpif(enabled.rev, rev());
      })
      .pipe(function () {
        return gulpif(enabled.maps, sourcemaps.write('.'));
      })();
};

/**
 * Script processing pipeline (reusable)
 *
 * Used to process script assets into compiled assets
 */
var jsPipeline = function (filename) {
  return lazypipe()
      .pipe(function () {
        return gulpif(enabled.maps, sourcemaps.init());
      })
      .pipe(babel, {
        presets: [['env', {
          "targets": {
            "chrome": "58",
            "ie": "10"
          }
        }]]
      })
      .pipe(concat, filename)
      .pipe(function () {
        return gulpif(config.minify, uglify({
          mangle: false,
          compress: false
        }));
      })
      .pipe(function () {
        return gulpif(enabled.rev, rev());
      })
      .pipe(function () {
        return gulpif(enabled.maps, sourcemaps.write('.', {
          sourceRoot: 'assets/scripts/'
        }));
      })();
};

/**
 * writeToManifest utility function
 *
 * If there are any revved files then write them to the rev manifest.
 * See https://github.com/sindresorhus/gulp-rev
 */
var writeToManifest = function (directory) {
  //console.log("Writing to manifest "+directory+" at "+path.dist);
  return lazypipe()
      .pipe(gulp.dest, path.dist + directory)
      .pipe(browserSync.stream, {match: path.dist + '**/*.{js,css}'})
      .pipe(rev.manifest, revManifest, {
        base: path.dist,
        merge: true
      })
      .pipe(gulp.dest, path.dist)();
};

/**
 * Styles task
 *
 * Compiles, combines, and optimizes all styles
 */
gulp.task('styles', function () {
  var merged = merge();
  manifest.forEachDependency('css', function (dep) {
    var cssPipelineInstance = cssPipeline(dep.name);
    if (!enabled.failStyleTask) {
      cssPipelineInstance.on('error', function (err) {
        console.error(err.message);
        this.emit('end');
      });
    }
    merged.add(gulp.src(dep.globs, {base: 'styles'})
        .pipe(plumber({errorHandler: onError}))
        //.pipe(print())
        .pipe(cssPipelineInstance));
  });
  return merged
      .pipe(writeToManifest('styles'));
});

/**
 * Scripts task
 *
 * Compiles, combines, and optimizes all scripts
 */
gulp.task('scripts', function () {
  var merged = merge();
  manifest.forEachDependency('js', function (dep) {
    //console.log(dep.name);
    merged.add(
        gulp.src(dep.globs, {base: 'scripts'})
        // Sort plugins alphabetically
            .pipe(gulpif(dep.name.includes('plugins'), sort(function (a, b) {
              // Prioritize jQuery
              //console.log(a.history[0]);
              //console.log(b.history[0]);
              if (a.history[0].includes('jquery')) {
                return 1;
              }
              if (b.history[0].includes('jquery')) {
                return 1;
              }
              return a.history[0].localeCompare(b.history[0]);
            })))
            //.pipe(print())
            .pipe(plumber({errorHandler: onError}))
            .pipe(jsPipeline(dep.name))
    );
  });
  return merged
      .pipe(writeToManifest('scripts'));
});

/**
 * Fonts task
 *
 * Grabs all the fonts and outputs them in a flattened directory
 */
gulp.task('fonts', function () {
  return gulp.src(globs.fonts)
      .pipe(flatten())
      // .pipe(gulp.dest(path.dist + 'fonts'))
      .pipe(browserSync.stream());
});

/**
 * Clean task
 *
 * Deletes entire compiled code folder
 */
gulp.task('clean', require('del').bind(null, [path.dist]));

/**
 * Watch task
 *
 * Once running, gulp will watch files for changes and run tbd automatically.
 * Compatible changes will be injected into the current browser session with
 * BrowserSync.
 */
gulp.task('watch', function () {
  // Set up BrowserSync
  browserSync.init({
    files: ['**/*.php', '*.php', path.dist + '**/*.{js,css}'],
    open: false,
    watchTask: true,
    proxy: config.devUrl,
    host: config.devUrl,
    port: 3000,
    snippetOptions: {
      whitelist: ['/wp-admin/admin-ajax.php'],
      blacklist: ['/wp-admin/**'],
    }
  });

  // Watch for file changes and run tbd
  gulp.watch(path.source + 'styles/**/*.scss', ['styles']);
  gulp.watch(path.source + 'scripts/**/*.js', ['scripts']);
  gulp.watch([path.source + 'fonts/**/*'], ['fonts']);
  gulp.watch(['manifest.json'], ['build']);
  gulp.watch(['**/*.html'], ['build']);
  gulp.watch(['*.html'], ['build']);
  gulp.watch(['gulpfile.js'], ['build']);
});

/**
 * Build task
 *
 * Same as running gulp without any arguments except the compiled code folder
 * doesn't get deleted first.
 */
gulp.task('build', function (callback) {
  runSequence('styles',
      'scripts',
      ['fonts', 'images'],
      callback);
});

// ### Images
// `gulp images` - Run lossless compression on all the images.
gulp.task('images', function() {
  return gulp.src(globs.images)
      .pipe(imagemin([
        imagemin.jpegtran({progressive: true}),
        imagemin.gifsicle({interlaced: true}),
        imagemin.svgo({plugins: [{removeUnknownsAndDefaults: false}, {cleanupIDs: false}]})
      ]))
      .pipe(gulp.dest(path.dist + 'images'))
      .pipe(browserSync.stream());
});

/**
 * Default task (clean and build)
 *
 * To compile for production run `gulp --production`
 */
gulp.task('default', ['clean'], function () {
  gulp.start('build');
});
