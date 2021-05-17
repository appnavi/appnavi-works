"use strict";
var profileMessageDialog = document.querySelector(".modal");
document.addEventListener("DOMContentLoaded", function () {
    M.Modal.init(profileMessageDialog, {});
});
document
    .querySelector(".default_creator_id-form")
    .addEventListener("submit", function (event) {
    event.preventDefault();
    var defaultCreatorId = document.querySelector('input[name="default_creator_id"]').value;
    var data = new FormData();
    data.append("default_creator_id", defaultCreatorId);
    var request = new XMLHttpRequest();
    request.open("POST", "/profile/default-creator-id", true);
    request.addEventListener("load", function () {
        if (request.status === 200) {
            showProfileMessageDialog("完了", "デフォルトの作者IDを設定しました。");
        }
        else {
            var errors = JSON.parse(request.response).errors;
            showProfileMessageDialog("エラー", errors.join("\n"));
        }
    });
    request.send(data);
});
function showProfileMessageDialog(title, message) {
    profileMessageDialog.querySelector(".title").textContent = title;
    profileMessageDialog.querySelector(".message").textContent = message;
    M.Modal.getInstance(profileMessageDialog).open();
}
