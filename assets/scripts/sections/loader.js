(function($){
  $(document).ready
  $('.page-container').hide();
  $(window).on('load',function (){
    setTimeout(() => {
      $('.loader').fadeOut();
      $('.page-container').fadeIn(500);
      $('.page-container').addClass('loaded');
    },500);
  });
})(jQuery);
