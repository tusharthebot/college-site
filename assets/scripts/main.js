(function ($) {
  //form
  var signUp = $("#signUp");
  var signIn = $("#signIn");
  var container = $(".form-wrap");

  signUp.click(function () {
    container.addClass("right-panel-active");
    console.log("signun")
  });
  signIn.click(function () {
    container.removeClass("right-panel-active");
    console.log("signin")
  });
  $(function () {
    var wow = new WOW({
      boxClass: 'wow',
      offset: 100,
      mobile: true,
      live: true,
      callback: function (box) {
        $(box).addClass('animate-complete');
      },
    });
    wow.init();
  });
  $(document).ready(function () {
    setTimeout(function () {
      added_body_color();
    }, 100);
  });
  $(window).on("load resize", function () {
    added_body_color();
  });

  function added_body_color() {
    if ($(window).width() > 1920) {
      var $extraSpace = $(window).width() - 1920;
      var $half_space = $extraSpace / 2;
      $(".left-side-color").css("width", $half_space + "px");
      $(".right-side-color").css("width", $half_space + "px");
    }
  }

})(jQuery);

// Limit content Js START

// Get part of an object if it is set
function object_get() {
  // Turn arguments into array and get what we need now
  var args = Array.prototype.slice.call(arguments);
  var object = args.shift();
  var parameter = args.shift();

  // Get value if it exists or run recursively to look for it
  if (typeof object === 'object' || typeof object === 'function') {
    if (parameter in object) {
      if (args.length === 0) {
        return object[parameter];
      }
      args.unshift(object[parameter]);
      return object_get.apply(null, args);
    }
  }
  return undefined;
}


// Return true or false based on if an object exists
function object_exists() {
  return typeof object_get.apply(this, arguments) !== 'undefined';
}

/** Validation functions **/

// Check for a valid string
function valid_string(input) {
  return (typeof input === 'string' && input.length > 0);
}

// Similar to limit_lines but adds text to reveal the hidden text (requires dotdotdot plugin)
function truncate_lines(target, lines, after, ellipsis) {
  // If target element exists
  var $target = jQuery(target);
  if ($target.length) {
    // Get line height of target
    var lineHeight = $target.find('p').css('line-height');
    if (lineHeight === 'normal') {
      lineHeight = 1.2 * parseFloat($target.css('font-size'));
    }

    // Set what will come after ellipsis
    if (typeof after === 'undefined')
      after = '';
    else
      lines = lines + 1;

    // Calculate the target height
    var targetHeight = lines * parseFloat(lineHeight);

    // Set default value for ellipsis
    if (typeof ellipsis === 'undefined')
      ellipsis = ' ';

    // Run the plugin if it exists
    if (object_exists(window, 'jQuery') &&
      object_exists(jQuery, 'fn', 'dotdotdot')) {
      $target.dotdotdot({
        ellipsis: ellipsis,
        height: targetHeight,
        watch: true,
        after: after,
        callback: function (isTruncated, origContent) {
          if (!isTruncated) {
            jQuery(origContent.prevObject[0]).siblings(after).remove();
          }
        }
      }).siblings(after).click(function () {
        var div = jQuery(this).siblings('.truncate-ellipses');
        var text = jQuery(after);
        // var div_height = div.parent().parent().height();

        if (jQuery(this).hasClass('close-it')) {
          // div.parent().parent().height(div_height - 190);
          div.dotdotdot({
            ellipsis: ellipsis,
            height: targetHeight,
            watch: true,
            after: after,
            callback: function (isTruncated, origContent) {
              if (!isTruncated) {
                jQuery(after).remove();
              }
            }
          }).siblings(after).empty().append('See More').removeClass('close-it');
        } else {
          div.height('auto').trigger('destroy').siblings('.see-more').empty().append('See Less').addClass('close-it');
          // div.parent().parent().height(div_height + 190);
        }
        return false;
      });
    }
  }
}

// Limit text to a certain number of lines (requires dotdotdot plugin)
function limit_lines(target, lines, ellipsis) {
  // If target element exists
  var $target = jQuery(target);
  if ($target.length) {
    // Get line height of target
    var lineHeight = $target.css('line-height');
    if (lineHeight === 'normal') {
      lineHeight = 1.2 * parseFloat($target.css('font-size'));
    }

    // Calculate the target height
    var targetHeight = lines * parseFloat(lineHeight);

    // Set default value for ellipsis
    if (typeof ellipsis === 'undefined')
      ellipsis = '...';

    if (ellipsis === 'space')
      ellipsis = ' '

    // Run the plugin if it exists
    if (object_exists(window, 'jQuery') &&
      object_exists(jQuery, 'fn', 'dotdotdot')) {
      $target.dotdotdot({
        ellipsis: ellipsis,
        height: targetHeight,
        watch: true,
        //        after: "a.see-more"
      });
    }
  }
}
