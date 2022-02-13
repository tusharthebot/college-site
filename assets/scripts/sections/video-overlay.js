(function ($) {
  $(window).on("load", function () {
    $("resource-detail .watch-video").each(function () {
      if ($(this).attr("data-video") === "") {
        $(this).removeClass("watch-video").css({
          pointerEvents: "none",
        });
      } else {
        $(this).addClass("watch-video");
      }
    });
    $(".watch-video").on("click", function (e) {
      e.preventDefault();
      $(".video-overlay-product").addClass("active");
      var video_link = $(this).attr("data-video");
      if (video_link.indexOf("watch") > 0) {
        var video_id = video_link.split("v=")[1];
        var ampersandPosition = video_id.indexOf("&");
        if (ampersandPosition != -1) {
          video_id = video_id.substring(0, ampersandPosition);
        }
        video_link = "https://youtube.com/embed/" + video_id;
      }
      $(".video-overlay-product .content-outer iframe").attr("src", video_link);
    });
    $(".video-overlay-product .content-outer .close-overlay").on(
      "click",
      function () {
        $(".video-overlay-product").removeClass("active");
        $(".video-overlay-product .content-outer iframe").attr("src", " ");
      }
    );
  });
})(jQuery);
