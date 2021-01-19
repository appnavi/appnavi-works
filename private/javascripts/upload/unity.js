//querySelector
const webglFilesInput = document.querySelector('input[name="webgl"]');
const windowsFilesInput = document.querySelector('input[name="windows"]');
const webglFileFieldFrame = document.querySelector(".input-field.file-field-frame.webgl");
const windowsFileFieldFrame = document.querySelector(".input-field.file-field-frame.windows");
const fileList = document.querySelector('.file-list');
const creatorIdInput = document.querySelector('input[name="creator_id"]');
const gameIdInput = document.querySelector('input[name="game_id"]');
const form = document.querySelector('form');
const uploadButton = document.querySelector('.uploadButton');
const uploadingIndicator = document.querySelector('.uploadingIndicator');

//Materializeのロード
document.addEventListener('DOMContentLoaded', function () {
  M.Collapsible.init(document.querySelector('.collapsible'), {
    onOpenStart: (elm) => {
      elm.querySelector('.collapsible-header>.material-icons').innerHTML = 'keyboard_arrow_up';
    },
    onCloseStart: (elm) => {
      elm.querySelector('.collapsible-header>.material-icons').innerHTML = 'keyboard_arrow_down';
    },
  });
  M.Modal.init(document.querySelector("#result-dialog"), {});
});

//ドラッグ&ドロップ時のUI変化
function initDragAndDrop(fileInput, frame) {
  fileInput.addEventListener("dragenter", (event) => {
    frame.classList.add("drag");
  });
  fileInput.addEventListener("dragleave", (event) => {
    frame.classList.remove("drag");
  });
  fileInput.addEventListener("drop", (event) => {
    frame.classList.remove("drag");
  });

}
initDragAndDrop(webglFilesInput, webglFileFieldFrame);
initDragAndDrop(windowsFilesInput, windowsFileFieldFrame);

//ドロップ時の動作
webglFilesInput.addEventListener('change', (event) => onFilesDropped('webgl', webglFilesInput));
windowsFilesInput.addEventListener('change', (event) => onFilesDropped('windows', windowsFilesInput));

function onMultipleFilesDropped(type, input) {
  const message = document.querySelector(`.message-hidden-folder-files.${type}`)
  message.classList.add('hide');
  const dt = new DataTransfer();
  Array.from(input.files).filter((file) => {//隠しフォルダ内のファイルを除去
    const directories = file.webkitRelativePath.split('/');
    return directories.find((dir) => dir.startsWith('.')) === undefined;
  }).forEach((file) => {
    dt.items.add(file);
  });
  const fileCountBefore = input.files.length;
  const fileCountAfter = dt.files.length;
  if (fileCountBefore > fileCountAfter) {
    message.classList.remove('hide');
  }
  input.files = dt.files;
}

function onFilesDropped(type, input) {
  const preview = fileList.querySelector(`.${type}`);
  preview.innerHTML = `${type}`;
  const filePaths = [];
  if (input.webkitdirectory) {
    onMultipleFilesDropped(type, input);
    Array.from(input.files).forEach((file) => {
      filePaths.push(file.webkitRelativePath.replace(/^[^\/]+\//, ''));
    });
  } else {
    filePaths.push(input.files[0].name);
  }
  filePaths.sort();
  filePaths.forEach((path) => {
    let parent = preview;
    path.split('/').forEach((section) => {
      let p_ul = Array.from(parent.childNodes).find((node) => node.tagName === 'UL');
      if (!p_ul) {
        p_ul = document.createElement('ul');
        parent.appendChild(p_ul);
      }
      let li = Array.from(p_ul.childNodes).find((node) => node.tagName === 'LI' && node.getAttribute('name') == section);
      if (!li) {
        li = document.createElement('li');
        li.innerHTML = section;
        li.setAttribute('name', section);
        p_ul.appendChild(li);
      }
      parent = li;
    });
  });
}


//アップロード先URL表示の同期
creatorIdInput.addEventListener('change', (ev) => {
  let creatorId = creatorIdInput.value;
  if (creatorId.length == 0) {
    creatorId = '(作者ID)';
  }
  document.querySelector('.file-list-header>.creator_id').innerHTML = creatorId;
});
gameIdInput.addEventListener('change', (ev) => {
  let gameId = gameIdInput.value;
  if (gameId.length == 0) {
    gameId = '(ゲームID)';
  }
  document.querySelector('.file-list-header>.game_id').innerHTML = gameId;
});

//ファイルアップロード
form.addEventListener('submit', function (event) {
  event.preventDefault();
  if (webglFilesInput.files.length == 0 && windowsFilesInput.files.length == 0) {
    return;
  }
  setUploading(true);
  const data = new FormData(form);
  const request = new XMLHttpRequest();
  request.open('POST', '', true);
  request.setRequestHeader('x-creator-id', document.querySelector('input[name="creator_id"]').value)
  request.setRequestHeader('x-game-id', document.querySelector('input[name="game_id"]').value)
  request.setRequestHeader('x-overwrites-existing', document.querySelector('input[name="overwrites_existing"]').checked)
  request.addEventListener('load', (ev) => {
    setUploading(false);
    let content = `<h4>${(request.status === 200) ? "アップロードに成功しました" : "アップロードに失敗しました"}</h4>`;
    if (request.status === 200) {
      const path = JSON.parse(request.response).path?.replaceAll("\\", "/");
      if (path !== undefined) {
        const url = `${location.origin}${path}`;
        content += `<p><a href="${url}">${url}</a>にアップロードしました。</p>`;
      }
    } else if (request.status === 401){
      content += "<p>ログインしなおす必要があります。</p><p>ページを再読み込みしてください</>";
    }else{
      content += request.response;
    }
    const dialog = document.querySelector("#result-dialog");
    dialog.querySelector('.modal-content').innerHTML = content;
    M.Modal.getInstance(dialog).open();
  })
  request.send(data);
});
function alertBeforeLeave(event) {
  event.preventDefault();
  event.returnValue = '';
}
function setUploading(uploading) {
  if (uploading) {
    uploadButton.classList.add('disabled');
    uploadingIndicator.classList.remove('hide');
    window.addEventListener('beforeunload', alertBeforeLeave);
  } else {
    uploadButton.classList.remove('disabled');
    uploadingIndicator.classList.add('hide');
    window.removeEventListener('beforeunload', alertBeforeLeave);
  }
}