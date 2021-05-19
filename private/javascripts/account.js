"use strict";
var accountMessageDialog = document.querySelector(".modal");
document.addEventListener("DOMContentLoaded", function () {
    M.Modal.init(accountMessageDialog, {});
    M.Collapsible.init(document.querySelectorAll(".collapsible"), {});
    M.Tooltip.init(document.querySelectorAll(".tooltipped"), {});
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
document.querySelectorAll(".restoreBackupButton").forEach(function (btn) {
    btn.addEventListener("click", function () {
        var request = new XMLHttpRequest();
        request.open("POST", "/account/restore-work-backup", true);
        var data = new FormData();
        data.append("creatorId", btn.attributes.getNamedItem("data-creator-id").value);
        data.append("workId", btn.attributes.getNamedItem("data-work-id").value);
        data.append("backupName", btn.attributes.getNamedItem("data-backup-name").value);
        request.send(data);
    });
});
