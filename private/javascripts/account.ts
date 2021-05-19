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
          const errorMessage = document.querySelector("p");
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
    const request = new XMLHttpRequest();
    request.open("POST", "/account/restore-work-backup", true);
    const data = new FormData();
    data.append(
      "creatorId",
      btn.attributes.getNamedItem("data-creator-id")!.value
    );
    data.append("workId", btn.attributes.getNamedItem("data-work-id")!.value);
    data.append(
      "backupName",
      btn.attributes.getNamedItem("data-backup-name")!.value
    );
    request.send(data);
  });
});
