/// <reference path="../common/dialogs.ts" />
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
      const dialog =
        document.querySelector<HTMLDivElement>(".renameWorkDialog")!;
      const renamedCreatorIdInput =
        dialog.querySelector<HTMLInputElement>("#renamedCreatorId")!;
      const renamedWorkIdInput =
        dialog.querySelector<HTMLInputElement>("#renamedWorkId")!;
      renamedCreatorIdInput.value = creatorId;
      renamedWorkIdInput.value = workId;
      const instance = M.Modal.getInstance(dialog);
      dialog.querySelector(".edit")!.addEventListener("click", () => {
        const renamedCreatorId = renamedCreatorIdInput.value;
        const renamedWorkId = renamedWorkIdInput.value;
        if (creatorId === renamedCreatorId && workId === renamedWorkId) {
          const message = document.createElement("p");
          message.append("編集前と編集後が同じです。");
          showMessageDialog("編集をキャンセルしました", message);
          return;
        }
        renameWork(creatorId, workId, renamedCreatorId, renamedWorkId);
      });
      instance.options.onOpenEnd = () => {
        M.updateTextFields();
      };
      instance.open();
    });
  });
document
  .querySelectorAll<HTMLButtonElement>(".deleteWorkButton")
  .forEach((btn) => {
    btn.addEventListener("click", () => {
      const creatorId = btn.dataset["creatorId"]!;
      const workId = btn.dataset["workId"]!;
      const content = document.createElement("div");
      let subContent = document.createElement("h5");
      subContent.innerText = `作品"${creatorId}/${workId}"を削除してもよろしいですか？`;
      content.append(subContent);
      subContent = document.createElement("p");
      subContent.innerText = "この作品の全てのバックアップも削除されます。";
      content.append(subContent);
      subContent = document.createElement("p");
      subContent.innerText = "削除した後は元の戻すことはできません。";
      content.append(subContent);
      showConfirmDialog(
        "確認",
        content,
        {
          label: "削除",
          classes: ["waves-effect", "waves-light", "btn", "red"],
          onPresed: () => {
            deleteWork(creatorId, workId);
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
  request.addEventListener("load", function () {
    const title =
      request.status === 200 ? "編集に成功しました" : "編集に失敗しました";
    const content = document.createElement("div");
    if (request.status === 400) {
      const errors = (JSON.parse(request.response).errors as string[]) ?? [];
      errors.forEach((err) => {
        const errorText = document.createElement("p");
        errorText.innerText = err;
        content.append(errorText);
      });
    } else if (request.status !== 200) {
      content.appendChild(document.createTextNode(request.response));
    }
    showMessageDialog(title, content, () => {
      if (request.status === 200) {
        location.reload();
      }
    });
  });
  request.send(data);
}
function deleteWork(creatorId: string, workId: string) {
  const data = new FormData();
  data.append("creatorId", creatorId);
  data.append("workId", workId);
  const request = new XMLHttpRequest();
  request.open("POST", "/account/work/delete", true);
  request.addEventListener("load", function () {
    const title =
      request.status === 200 ? "削除しました" : "削除に失敗しました";
    const content = document.createElement("div");
    if (request.status === 400) {
      const errors = (JSON.parse(request.response).errors as string[]) ?? [];
      errors.forEach((err) => {
        const errorText = document.createElement("p");
        errorText.innerText = err;
        content.append(errorText);
      });
    } else if (request.status !== 200) {
      content.appendChild(document.createTextNode(request.response));
    }
    showMessageDialog(title, content, () => {
      if (request.status === 200) {
        location.reload();
      }
    });
  });
  request.send(data);
}