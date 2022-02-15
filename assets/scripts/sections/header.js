(function($){
  $(window).on('load',function (){
    console.log('test');
    $('.header .wrapper .col-two .main-link').each(function() {
      // $(this).on("click", function(){
      console.log(this);
      console.log('test');
    });
    // $('.header .wrapper .col-two .link-wrap ul li .sub-menu').addClass('test');
  });
})(jQuery);
