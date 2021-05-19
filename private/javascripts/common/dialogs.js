"use strict";
document.addEventListener("DOMContentLoaded", function () {
    M.Modal.init(document.querySelectorAll(".modal"), {});
});
function showMessageDialog(title, content) {
    var dialog = document.querySelector(".messageDialog.modal");
    dialog.querySelector(".title").textContent = title;
    dialog.querySelector(".content").appendChild(content);
    M.Modal.getInstance(dialog).open();
}
function showConfirmDialog(title, content, positiveButtonLabel, onPositiveButtonPressed, negativeButtonLabel, onNegativeButtonPressed) {
    var dialog = document.querySelector(".confirmDialog.modal");
    dialog.querySelector(".title").textContent = title;
    dialog.querySelector(".content").appendChild(content);
    var positiveButton = dialog.querySelector(".positiveButton");
    positiveButton.textContent = positiveButtonLabel;
    positiveButton.addEventListener("click", onPositiveButtonPressed);
    var negativeButton = dialog.querySelector(".negativeButton");
    negativeButton.textContent = negativeButtonLabel;
    negativeButton.addEventListener("click", onNegativeButtonPressed);
    M.Modal.getInstance(dialog).open();
}
