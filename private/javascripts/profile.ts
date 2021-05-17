const profileMessageDialog = document.querySelector(".modal") as HTMLElement;
document.addEventListener("DOMContentLoaded", () => {
  M.Modal.init(profileMessageDialog, {});
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
    request.open("POST", "/profile/default-creator-id", true);
    request.addEventListener("load", () => {
      if (request.status === 200) {
        showProfileMessageDialog("完了", "デフォルトの作者IDを設定しました。");
      } else {
        const errors = JSON.parse(request.response).errors as string[];
        showProfileMessageDialog("エラー", errors.join("\n"));
      }
    });
    request.send(data);
  });

function showProfileMessageDialog(title: string, message: string) {
  profileMessageDialog.querySelector(".title")!.textContent = title;
  profileMessageDialog.querySelector(".message")!.textContent = message;
  M.Modal.getInstance(profileMessageDialog).open();
}
