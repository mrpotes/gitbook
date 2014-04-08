define([
    "jQuery",
    "core/state"
], function($, state){
    // Bind an exercise
    var prepareReveal = function($reveal) {
        $reveal.find("a[data-reveal]").click(function(e) {
            e.preventDefault();
            $(this).closest("div.reveal").find(".revealable").addClass("hidden");
            $("#"+$(this).data("reveal")).removeClass("hidden");
            $(this).siblings(".btn-primary").removeClass("btn-primary");
            $(this).addClass("btn-primary");
        });
    };

    // Prepare all exercise
    var init = function() {
        state.$book.find("section.reveal").each(function() {
            prepareReveal($(this));
        });
    };

    return {
        init: init,
        prepare: prepareReveal
    };
});
