/// <reference path="./common/dialogs.ts" />
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

document
  .querySelectorAll<HTMLButtonElement>(".restoreBackupButton")
  .forEach((btn) => {
    btn.addEventListener("click", () => {
      const creatorId = btn.dataset["creatorId"]!;
      const workId = btn.dataset["workId"]!;
      const backupName = btn.dataset["backupName"]!;
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
document
  .querySelectorAll<HTMLButtonElement>(".deleteBackupButton")
  .forEach((btn) => {
    btn.addEventListener("click", () => {
      const creatorId = btn.dataset["creatorId"]!;
      const workId = btn.dataset["workId"]!;
      const backupName = btn.dataset["backupName"]!;
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
document
  .querySelectorAll<HTMLButtonElement>(".renameWorkButton")
  .forEach((btn) => {
    btn.addEventListener("click", () => {
      const creatorId = btn.dataset["creatorId"]!;
      const workId = btn.dataset["workId"]!;
      const dialog = document.querySelector<HTMLDivElement>(
        ".renameWorkDialog"
      )!;
      const renamedCreatorIdInput = dialog.querySelector<HTMLInputElement>(
        "#renamedCreatorId"
      )!;
      const renamedWorkIdInput = dialog.querySelector<HTMLInputElement>(
        "#renamedWorkId"
      )!;
      renamedCreatorIdInput.value = creatorId;
      renamedWorkIdInput.value = workId;
      const instance = M.Modal.getInstance(dialog);
      instance.options.onOpenEnd = () => {
        M.updateTextFields();
      };
      instance.options.onCloseEnd = () => {
        const renamedCreatorId = renamedCreatorIdInput.value;
        const renamedWorkId = renamedWorkIdInput.value;
        if (creatorId === renamedCreatorId && workId === renamedWorkId) {
          const message = document.createElement("p");
          message.append("編集前と編集後が同じです。");
          showMessageDialog("編集をキャンセルしました", message);
          return;
        }
        renameWork(creatorId, workId, renamedCreatorId, renamedWorkId);
      };
      instance.open();
    });
  });

function restoreBackup(creatorId: string, workId: string, backupName: string) {
  const request = new XMLHttpRequest();
  request.open("POST", "/account/backup/restore", true);
  const data = new FormData();
  data.append("creatorId", creatorId);
  data.append("workId", workId);
  data.append("backupName", backupName);
  request.addEventListener("load", function () {
    if (request.status === 200) {
      var message = document.createElement("p");
      message.textContent = `バックアップ${backupName}を復元しました。`;
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
function deleteBackup(creatorId: string, workId: string, backupName: string) {
  const request = new XMLHttpRequest();
  request.open("POST", "/account/backup/delete", true);
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
function renameWork(
  creatorId: string,
  workId: string,
  renamedCreatorId: string,
  renamedWorkId: string
) {
  const data = new FormData();
  data.append("creatorId", creatorId);
  data.append("workId", workId);
  data.append("renamedCreatorId", renamedCreatorId);
  data.append("renamedWorkId", renamedWorkId);
  const request = new XMLHttpRequest();
  request.open("POST", "/account/work/rename", true);
  request.addEventListener("load", function (ev) {
    const title =
      request.status === 200 ? "編集に成功しました" : "編集に失敗しました";
    const content = document.createElement("div");
    if (request.status !== 200) {
      content.appendChild(document.createTextNode(request.response));
    }
    showMessageDialog(title, content, () => {
      location.reload();
    });
  });
  request.send(data);
}
