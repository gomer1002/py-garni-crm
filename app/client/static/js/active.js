(function ($) {
    "use strict";

    // :: Nav Active Code
    if ($.fn.classyNav) {
        $("#essenceNav").classyNav();
    }

    // :: Sliders Active Code
    if ($.fn.owlCarousel) {
        $(".main-slider-container").owlCarousel({
            items: 1,
            margin: 30,
            loop: true,
            nav: false,
            dots: false,
            autoplay: true,
            autoplayTimeout: 5000,
            smartSpeed: 1000,
        });
    }

    // :: PreventDefault a Click
    $("a[href='#']").on("click", function ($) {
        $.preventDefault();
    });
})(jQuery);
