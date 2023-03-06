/// <reference path="../../common/dialogs.ts" />
/// <reference path="../../common/request.ts" />
const form = document.querySelector("form") as HTMLFormElement;
const creatorIdInput = document.querySelector(
  'input[name="creator_id"]'
) as HTMLInputElement;
const workIdInput = document.querySelector(
  'input[name="work_id"]'
) as HTMLInputElement;
const webglFilesInput = document.querySelector(
  'input[name="webgl"]'
) as HTMLInputElement;
const windowsFilesInput = document.querySelector(
  'input[name="windows"]'
) as HTMLInputElement;
const webglFileFieldFrame = document.querySelector(
  ".input-field.file-field-frame.webgl"
) as HTMLDivElement;
const windowsFileFieldFrame = document.querySelector(
  ".input-field.file-field-frame.windows"
) as HTMLDivElement;
const fileList = document.querySelector(".file-list") as HTMLDivElement;

const uploadButton = document.querySelector(
  ".uploadButton"
) as HTMLButtonElement;
const uploadingIndicator = document.querySelector(
  ".uploadingIndicator"
) as HTMLElement;

//Materializeのロード
document.addEventListener("DOMContentLoaded", function () {
  M.Collapsible.init(document.querySelector(".collapsible") as Element, {
    onOpenStart: (elm) => {
      const header = elm.querySelector(
        ".collapsible-header>.material-icons"
      ) as HTMLElement;
      header.innerHTML = "keyboard_arrow_up";
    },
    onCloseStart: (elm) => {
      const header = elm.querySelector(
        ".collapsible-header>.material-icons"
      ) as HTMLElement;
      header.innerHTML = "keyboard_arrow_down";
    },
  });
  setTimeout(() => M.updateTextFields(), 0);
});

//ドラッグ&ドロップ時のUI変化
function initDragAndDrop(fileInput: HTMLInputElement, frame: HTMLDivElement) {
  fileInput.addEventListener("dragenter", (_) => {
    frame.classList.add("drag");
  });
  fileInput.addEventListener("dragleave", (_) => {
    frame.classList.remove("drag");
  });
  fileInput.addEventListener("drop", (_) => {
    frame.classList.remove("drag");
  });
}
initDragAndDrop(webglFilesInput, webglFileFieldFrame);
initDragAndDrop(windowsFilesInput, windowsFileFieldFrame);

//ドロップ時の動作
webglFilesInput.addEventListener("change", (_) =>
  onFilesDropped("webgl", webglFilesInput)
);
windowsFilesInput.addEventListener("change", (_) =>
  onFilesDropped("windows", windowsFilesInput)
);

function onMultipleFilesDropped(type: string, input: HTMLInputElement) {
  const message = document.querySelector(
    `.message-hidden-folder-files.${type}`
  ) as HTMLDivElement;
  message.classList.add("hide");
  const dt = new DataTransfer();
  const files = input.files ?? new FileList();
  Array.from(files)
    .filter((file) => {
      //隠しフォルダ内のファイルを除去
      const directories =
        ((file as any).webkitRelativePath?.split("/") as string[]) ?? [];
      return directories.find((dir) => dir.startsWith(".")) === undefined;
    })
    .forEach((file) => {
      dt.items.add(file);
    });
  const fileCountBefore = input.files?.length ?? 0;
  const fileCountAfter = dt.files.length;
  if (fileCountBefore > fileCountAfter) {
    message.classList.remove("hide");
  }
  input.files = dt.files;
}

function onFilesDropped(type: string, input: HTMLInputElement) {
  const preview = fileList.querySelector(`.${type}`) as HTMLElement;
  preview.innerHTML = `${type}`;
  const filePaths: string[] = [];
  if ((input as any).webkitdirectory) {
    onMultipleFilesDropped(type, input);
    const files = input.files ?? new FileList();
    Array.from(files).forEach((file) => {
      filePaths.push((file as any).webkitRelativePath.replace(/^[^\/]+\//, ""));
    });
  } else {
    const files = input.files ?? new FileList();
    filePaths.push(files[0]?.name);
  }
  filePaths.sort();
  filePaths.forEach((path) => {
    let parent = preview;
    path.split("/").forEach((section) => {
      let p_ul = (Array.from(parent.childNodes) as HTMLElement[]).find(
        (node) => node.tagName === "UL"
      );
      if (!p_ul) {
        p_ul = document.createElement("ul");
        parent.appendChild(p_ul);
      }
      let li = (Array.from(p_ul.childNodes) as HTMLElement[]).find(
        (node) => node.tagName === "LI" && node.getAttribute("name") == section
      ) as HTMLElement;
      if (!li) {
        li = document.createElement("li");
        li.innerHTML = section;
        li.setAttribute("name", section);
        p_ul.appendChild(li);
      }
      parent = li;
    });
  });
}

//アップロード先URL表示の同期
creatorIdInput.addEventListener("change", (_) => {
  let creatorId = creatorIdInput.value;
  if (creatorId.length == 0) {
    creatorId = "(作者ID)";
  }
  const preview = document.querySelector(
    ".file-list-header>.creator_id"
  ) as HTMLDivElement;
  preview.innerHTML = creatorId;
});
workIdInput.addEventListener("change", (_) => {
  let workId = workIdInput.value;
  if (workId.length == 0) {
    workId = "(作品ID)";
  }
  const preview = document.querySelector(
    ".file-list-header>.work_id"
  ) as HTMLDivElement;
  preview.innerHTML = workId;
});

//ファイルアップロード
form.addEventListener("submit", async function (event) {
  event.preventDefault();
  if (
    webglFilesInput.files?.length === 0 &&
    windowsFilesInput.files?.length === 0
  ) {
    const content = document.createElement("div");
    content.textContent =
      "WebGLまたはWindowsのいずれかのファイルを選択してください";
    showMessageDialog("ファイルが選択されていません", content);
    return;
  }
  setUploading(true);
  const data = new FormData(form);
  const token = getCsrfTokenFromPage();
  const res = await fetch("/api/upload/unity", {
    credentials: "same-origin",
    method: "POST",
    body: data,
    headers: {
      "CSRF-Token": token,
      "x-creator-id": creatorIdInput.value,
      "x-work-id": workIdInput.value,
    },
  });
  setUploading(false);
  const title =
    res.status === 200
      ? "アップロードに成功しました"
      : "アップロードに失敗しました";
  const content = document.createElement("div");
  const body = (await res.json()) as { paths?: string[]; errors?: string[] };
  if (res.status === 200) {
    const paths = body.paths ?? [];
    paths
      .map((p) => p.replace(/\\/g, "/"))
      .forEach((p) => {
        const url = `${location.origin}${p}`;
        const workUrlHolder = document.createElement("p");
        const workUrl = document.createElement("a");
        workUrl.href = url;
        workUrl.textContent = url;
        workUrlHolder.appendChild(workUrl);
        workUrlHolder.appendChild(
          document.createTextNode("にアップロードしました。")
        );
        content.appendChild(workUrlHolder);
      });
  } else if (res.status === 401) {
    content.appendChild(
      document.createTextNode("ログインしなおす必要があります。")
    );
    content.appendChild(
      document.createTextNode("ページを再読み込みしてください。")
    );
  } else if (res.status === 400) {
    const errors = body.errors ?? [];
    errors.forEach((err) => {
      const errorText = document.createElement("p");
      errorText.innerText = err;
      content.append(errorText);
    });
  } else {
    content.appendChild(document.createTextNode(await res.text()));
  }
  showMessageDialog(title, content);
});
function alertBeforeLeave(event: BeforeUnloadEvent) {
  event.preventDefault();
  event.returnValue = "";
}
function setUploading(uploading: boolean) {
  if (uploading) {
    uploadButton.classList.add("disabled");
    uploadingIndicator.classList.remove("hide");
    window.addEventListener("beforeunload", alertBeforeLeave);
  } else {
    uploadButton.classList.remove("disabled");
    uploadingIndicator.classList.add("hide");
    window.removeEventListener("beforeunload", alertBeforeLeave);
  }
}