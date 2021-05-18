"use strict";
var accountMessageDialog = document.querySelector(".modal");
document.addEventListener("DOMContentLoaded", function () {
    M.Modal.init(accountMessageDialog, {});
});
document
    .querySelector(".default_creator_id-form")
    .addEventListener("submit", function (event) {
    event.preventDefault();
    var defaultCreatorId = document.querySelector('input[name="default_creator_id"]').value;
    var data = new FormData();
    data.append("default_creator_id", defaultCreatorId);
    var request = new XMLHttpRequest();
    request.open("POST", "/account/default-creator-id", true);
    request.addEventListener("load", function () {
        if (request.status === 200) {
            showAccountMessageDialog("完了", "デフォルトの作者IDを設定しました。");
        }
        else {
            var errors = JSON.parse(request.response).errors;
            showAccountMessageDialog("エラー", errors.join("\n"));
        }
    });
    request.send(data);
});
function showAccountMessageDialog(title, message) {
    accountMessageDialog.querySelector(".title").textContent = title;
    accountMessageDialog.querySelector(".message").textContent = message;
    M.Modal.getInstance(accountMessageDialog).open();
}
