//querySelector
const webglFilesField = document.querySelector('input[name="webgl"]');
const fileFieldFrame = document.querySelector(".input-field.file-field-frame");
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
webglFilesField.addEventListener("dragenter", (event) => {
  fileFieldFrame.classList.add("drag");
});
webglFilesField.addEventListener("dragleave", (event) => {
  fileFieldFrame.classList.remove("drag");
});
webglFilesField.addEventListener("drop", (event) => {
  fileFieldFrame.classList.remove("drag");
});

//ドロップ時の動作
webglFilesField.addEventListener('change', (event) => onFilesDropped());
function onFilesDropped() {
  fileList.innerHTML = '';
  document.querySelector('.message-hidden-folder-files').classList.add('hide');
  const filePaths = [];
  const dt = new DataTransfer();
  Array.from(webglFilesField.files).filter((file) => {//隠しフォルダ内のファイルを除去
    const directories = file.webkitRelativePath.split('/');
    return directories.find((dir) => dir.startsWith('.')) === undefined;
  }).forEach((file) => {
    filePaths.push(file.webkitRelativePath.replace(/^[^\/]+\//, ''));
    dt.items.add(file);
  });
  const fileCountBefore = webglFilesField.files.length;
  const fileCountAfter = dt.files.length;
  if (fileCountBefore > fileCountAfter) {
    document.querySelector('.message-hidden-folder-files').classList.remove('hide');
  }
  webglFilesField.files = dt.files;
  filePaths.sort();
  filePaths.forEach((path) => {
    let parent = fileList;
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
  const fileCount = document.querySelector('.file-count');
  fileCount.innerHTML = `${dt.items.length}個のファイル`;
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
  setUploading(true);
  const data = new FormData(form);
  const request = new XMLHttpRequest();
  request.open('POST', '/upload/webgl', true);
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
    } else {
      content += request.response;
    }
    const dialog = document.querySelector("#result-dialog");
    dialog.querySelector('.modal-content').innerHTML = content;
    M.Modal.getInstance(dialog).open();
  })
  request.send(data);
});
function alertBeforeLeave(event){
  event.preventDefault();
  event.returnValue = '';
}
function setUploading(uploading){
  if(uploading){
    uploadButton.classList.add('disabled');
    uploadingIndicator.classList.remove('hide');
    window.addEventListener('beforeunload', alertBeforeLeave);
  }else{
    uploadButton.classList.remove('disabled');
    uploadingIndicator.classList.add('hide');
    window.removeEventListener('beforeunload', alertBeforeLeave);
  }
}