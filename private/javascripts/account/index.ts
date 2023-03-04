/// <reference path="../common/dialogs.ts" />
/// <reference path="../common/request.ts" />
document.addEventListener("DOMContentLoaded", () => {
  M.Collapsible.init(document.querySelectorAll(".collapsible"), {});
  M.Tooltip.init(document.querySelectorAll(".tooltipped"), {});
});
document
  .querySelector<HTMLFormElement>(".default_creator_id-form")!
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const defaultCreatorId = document.querySelector<HTMLInputElement>(
      'input[name="default_creator_id"]'
    )!.value;
    const data = new FormData();
    data.append("default_creator_id", defaultCreatorId);
    postRequest("/api/account/default-creator-id", data, {
      dialogMessage: "デフォルトの作者IDを設定しました。",
    });
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
document
  .querySelectorAll<HTMLButtonElement>(".cleanupCreatorIdsButton")
  .forEach((btn) => {
    btn.addEventListener("click", () => {
      const content = document.createElement("div");
      let subContent = document.createElement("h5");
      subContent.innerText = `使用していない作者IDを一覧から削除してもよろしいですか？`;
      content.append(subContent);
      subContent = document.createElement("p");
      subContent.innerText =
        "これにより、他のユーザーがその作者IDを利用できるようになります。";
      content.append(subContent);
      subContent = document.createElement("p");
      subContent.innerText =
        "少なくとも一つの作品で用いられている作者IDは削除できません。";
      content.append(subContent);
      showConfirmDialog(
        "確認",
        content,
        {
          label: "削除",
          classes: ["waves-effect", "waves-light", "btn", "red"],
          onPresed: () => {
            cleanupCreatorIds();
          },
        },
        {
          label: "キャンセル",
          classes: ["waves-effect", "waves-light", "btn-flat"],
        }
      );
    });
  });

async function restoreBackup(
  creatorId: string,
  workId: string,
  backupName: string
) {
  const data = new FormData();
  data.append("creatorId", creatorId);
  data.append("workId", workId);
  data.append("backupName", backupName);
  postRequest("/account/backup/restore", data, {
    dialogMessage: `バックアップ${backupName}を復元しました。`,
    onDialogClosed: () => {
      location.reload();
    },
  });
}
async function deleteBackup(
  creatorId: string,
  workId: string,
  backupName: string
) {
  const data = new FormData();
  data.append("creatorId", creatorId);
  data.append("workId", workId);
  data.append("backupName", backupName);
  postRequest("/account/backup/delete", data, {
    dialogMessage: `バックアップ${backupName}を削除しました。`,
    onDialogClosed: () => {
      location.reload();
    },
  });
}
async function renameWork(
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
  postRequest(
    "/account/work/rename",
    data,
    {
      dialogTitle: "編集に成功しました",
      onDialogClosed: () => {
        location.reload();
      },
    },
    {
      dialogTitle: "編集に失敗しました",
    }
  );
}
async function deleteWork(creatorId: string, workId: string) {
  const data = new FormData();
  data.append("creatorId", creatorId);
  data.append("workId", workId);
  postRequest(
    "/account/work/delete",
    data,
    {
      dialogTitle: "削除しました",
      onDialogClosed: () => {
        location.reload();
      },
    },
    {
      dialogTitle: "削除に失敗しました",
    }
  );
}

async function cleanupCreatorIds() {
  postRequest(
    "/api/account/cleanup-creator-ids",
    new FormData(),
    {
      dialogTitle: "使用していない作者IDの削除に成功しました。",
      onDialogClosed: () => {
        location.reload();
      },
    },
    {
      dialogTitle: "使用していない作者IDの削除に成功しました。",
    }
  );
}
