//querySelector
const filesField = document.querySelector('input[name="game"]');
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
filesField.addEventListener("dragenter", (event) => {
  fileFieldFrame.classList.add("drag");
});
filesField.addEventListener("dragleave", (event) => {
  fileFieldFrame.classList.remove("drag");
});
filesField.addEventListener("drop", (event) => {
  fileFieldFrame.classList.remove("drag");
});

//ドロップ時の動作
filesField.addEventListener('change', (event) => onFilesDropped());
function onFilesDropped() {
  fileList.innerHTML = '';
  document.querySelector('.message-hidden-folder-files').style.display = 'none';
  const filePaths = [];
  const dt = new DataTransfer();
  Array.from(filesField.files).filter((file) => {//隠しフォルダ内のファイルを除去
    const directories = file.webkitRelativePath.split('/');
    return directories.find((dir) => dir.startsWith('.')) === undefined;
  }).forEach((file) => {
    filePaths.push(file.webkitRelativePath.replace(/^[^\/]+\//, ''));
    dt.items.add(file);
  });
  const fileCountBefore = filesField.files.length;
  const fileCountAfter = dt.files.length;
  if (fileCountBefore > fileCountAfter) {
    document.querySelector('.message-hidden-folder-files').style.display = 'block';
  }
  filesField.files = dt.files;
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


//アップロード先URLの同期
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


form.addEventListener('submit', function (event) {
  event.preventDefault();
  uploadButton.classList.add('disabled');
  uploadingIndicator.style.display = 'flex'
  const data = new FormData(form);
  const request = new XMLHttpRequest();
  request.open('POST', '/upload/webgl', true);
  request.setRequestHeader('x-creator-id', document.querySelector('input[name="creator_id"]').value)
  request.setRequestHeader('x-game-id', document.querySelector('input[name="game_id"]').value)
  request.setRequestHeader('x-overwrites-existing', document.querySelector('input[name="overwrites_existing"]').checked)
  request.addEventListener('load', (ev) => {
    uploadButton.classList.remove('disabled');
    uploadingIndicator.style.display = 'none';
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
  uploadButton.classList.add('disabled');
  uploadingIndicator.style.display = 'flex'
});

