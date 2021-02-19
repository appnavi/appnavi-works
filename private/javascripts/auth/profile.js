"use strict";
document.addEventListener("DOMContentLoaded", function () {
    var dialog = document.querySelector(".modal");
    if (dialog) {
        M.Modal.init(dialog, {});
        M.Modal.getInstance(dialog).open();
    }
});
