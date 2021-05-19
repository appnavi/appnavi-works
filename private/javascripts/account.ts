document.addEventListener("DOMContentLoaded", () => {
  M.Collapsible.init(document.querySelectorAll(".collapsible"), {});
  M.Tooltip.init(document.querySelectorAll(".tooltipped"), {});
});
document
  .querySelector<HTMLFormElement>(".default_creator_id-form")!
  .addEventListener("submit", (event) => {
    event.preventDefault();
    const defaultCreatorId = document.querySelector<HTMLInputElement>(
      'input[name="default_creator_id"]'
    )!.value;
    const data = new FormData();
    data.append("default_creator_id", defaultCreatorId);
    const request = new XMLHttpRequest();
    request.open("POST", "/account/default-creator-id", true);
    request.addEventListener("load", () => {
      if (request.status === 200) {
        const message = document.createElement("p");
        message.textContent = "デフォルトの作者IDを設定しました。";
        showMessageDialog("完了", message);
      } else {
        const errors = JSON.parse(request.response).errors as string[];
        const message = document.createElement("div");
        errors.forEach((error) => {
          const errorMessage = document.createElement("p");
          errorMessage.textContent = error;
          message.appendChild(errorMessage);
        });
        showMessageDialog("エラー", message);
      }
    });
    request.send(data);
  });

document.querySelectorAll(".restoreBackupButton").forEach((btn) => {
  btn.addEventListener("click", () => {
    const creatorId = btn.attributes.getNamedItem("data-creator-id")!.value;
    const workId = btn.attributes.getNamedItem("data-work-id")!.value;
    const backupName = btn.attributes.getNamedItem("data-backup-name")!.value;
    const message = document.createElement("p");
    message.textContent = `バックアップ${backupName}を復元しますか？`;
    showConfirmDialog(
      "確認",
      message,
      {
        label: "復元する",
        onPresed: () => {
          restoreBackup(creatorId, workId, backupName);
        },
      },
      { label: "キャンセル" }
    );
  });
});
document.querySelectorAll(".deleteBackupButton").forEach((btn) => {
  btn.addEventListener("click", () => {
    const creatorId = btn.attributes.getNamedItem("data-creator-id")!.value;
    const workId = btn.attributes.getNamedItem("data-work-id")!.value;
    const backupName = btn.attributes.getNamedItem("data-backup-name")!.value;
    const message = document.createElement("p");
    message.textContent = `バックアップ${backupName}を削除しますか？`;
    showConfirmDialog(
      "確認",
      message,
      {
        label: "削除する",
        classes: ["waves-effect", "waves-light", "btn", "red"],
        onPresed: () => {
          deleteBackup(creatorId, workId, backupName);
        },
      },
      {
        label: "キャンセル",
        classes: ["waves-effect", "waves-light", "btn-flat"],
      }
    );
  });
});

function restoreBackup(creatorId: string, workId: string, backupName: string) {
  const request = new XMLHttpRequest();
  request.open("POST", "/account/restore-work-backup", true);
  const data = new FormData();
  data.append("creatorId", creatorId);
  data.append("workId", workId);
  data.append("backupName", backupName);
  request.addEventListener("load", function () {
    if (request.status === 200) {
      var message = document.createElement("p");
      message.textContent = `バックアップ${backupName}を復元しました。`;
      showMessageDialog("完了", message);
    } else {
      const errors = JSON.parse(request.response).errors as string[];
      const message = document.createElement("div");
      errors.forEach((error) => {
        const errorMessage = document.createElement("p");
        errorMessage.textContent = error;
        message.appendChild(errorMessage);
      });
      showMessageDialog("エラー", message);
    }
  });
  request.send(data);
}
function deleteBackup(creatorId: string, workId: string, backupName: string) {
  const request = new XMLHttpRequest();
  request.open("POST", "/account/delete-work-backup", true);
  const data = new FormData();
  data.append("creatorId", creatorId);
  data.append("workId", workId);
  data.append("backupName", backupName);
  request.addEventListener("load", function () {
    if (request.status === 200) {
      var message = document.createElement("p");
      message.textContent = `バックアップ${backupName}を削除しました。`;
      showMessageDialog("完了", message, () => {
        location.reload();
      });
    } else {
      const errors = JSON.parse(request.response).errors as string[];
      const message = document.createElement("div");
      errors.forEach((error) => {
        const errorMessage = document.createElement("p");
        errorMessage.textContent = error;
        message.appendChild(errorMessage);
      });
      showMessageDialog("エラー", message);
    }
  });
  request.send(data);
}
