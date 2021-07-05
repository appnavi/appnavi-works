interface ResponseBody {
  errors?: string[];
}

async function postRequest(
  url: string,
  data: FormData,
  success: {
    dialogTitle?: string;
    dialogMessage?: string;
    onDialogClosed?: () => void;
  },
  fail?: {
    dialogTitle?: string;
    dialogMessage?: string;
  }
) {
  const res = await fetch(url, {
    method: "POST",
    body: data,
  });
  const status = res.status;
  if (status === 200) {
    const message = document.createElement("p");
    message.textContent = success.dialogMessage ?? "";
    showMessageDialog(
      success.dialogTitle ?? "完了",
      message,
      success.onDialogClosed
    );
  } else if (res.status === 401) {
    const content = document.createElement("p");
    content.appendChild(
      document.createTextNode("ログインしなおす必要があります。")
    );
    content.appendChild(
      document.createTextNode(
        "このダイアログを閉じるとログイン画面に遷移します。"
      )
    );
    showMessageDialog(fail?.dialogTitle ?? "エラー", content, () => {
      location.reload();
    });
  } else if (status === 400) {
    const body = (await res.json()) as ResponseBody;
    const errors = body.errors ?? [];
    const message = document.createElement("div");
    errors.forEach((error) => {
      const errorMessage = document.createElement("p");
      errorMessage.textContent = error;
      message.appendChild(errorMessage);
    });
    showMessageDialog(fail?.dialogMessage ?? "エラー", message);
  } else if (status > 400) {
    const message = document.createElement("p");
    message.textContent = "エラーが発生しました。";
    showMessageDialog(fail?.dialogTitle ?? "エラー", message);
  } else {
    throw new Error("不明なステータスコード");
  }
}
