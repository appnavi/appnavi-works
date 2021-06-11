/// <reference path="../../common/dialogs.ts" />
document
  .querySelectorAll<HTMLButtonElement>(".deleteGuestButton")
  .forEach((btn) => {
    btn.addEventListener("click", () => {
      const guestId = btn.dataset["guestId"];
      if (guestId === undefined) {
        return;
      }
      const message = document.createElement("div");
      let para = document.createElement("p");
      para.textContent = `この操作は取り消せません。`;
      message.append(para);
      para = document.createElement("p");
      para.textContent = `作品が存在するゲストユーザーは削除できません。`;
      message.append(para);
      showConfirmDialog(
        `ゲストユーザー"${guestId}"を削除しますか？`,
        message,
        {
          label: "削除する",
          classes: ["waves-effect", "waves-light", "btn", "red"],
          onPresed: () => {
            deleteGuest(guestId);
          },
        },
        {
          label: "キャンセル",
          classes: ["waves-effect", "waves-light", "btn-flat"],
        }
      );
    });
  });

function deleteGuest(guestId: string) {
  const request = new XMLHttpRequest();
  request.open("POST", "/account/guest/delete", true);
  const data = new FormData();
  data.append("guestId", guestId);
  request.addEventListener("load", function () {
    if (request.status === 200) {
      var message = document.createElement("p");
      message.textContent = `ゲストユーザー${guestId}を削除しました。`;
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