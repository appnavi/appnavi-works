"use strict";
var form = document.querySelector("form");
var creatorIdInput = document.querySelector('input[name="creator_id"]');
var workIdInput = document.querySelector('input[name="work_id"]');
var webglFilesInput = document.querySelector('input[name="webgl"]');
var windowsFilesInput = document.querySelector('input[name="windows"]');
var webglFileFieldFrame = document.querySelector(".input-field.file-field-frame.webgl");
var windowsFileFieldFrame = document.querySelector(".input-field.file-field-frame.windows");
var fileList = document.querySelector(".file-list");
var uploadButton = document.querySelector(".uploadButton");
var uploadingIndicator = document.querySelector(".uploadingIndicator");
document.addEventListener("DOMContentLoaded", function () {
    M.Collapsible.init(document.querySelector(".collapsible"), {
        onOpenStart: function (elm) {
            var header = elm.querySelector(".collapsible-header>.material-icons");
            header.innerHTML = "keyboard_arrow_up";
        },
        onCloseStart: function (elm) {
            var header = elm.querySelector(".collapsible-header>.material-icons");
            header.innerHTML = "keyboard_arrow_down";
        },
    });
    setTimeout(function () { return M.updateTextFields(); }, 0);
});
function initDragAndDrop(fileInput, frame) {
    fileInput.addEventListener("dragenter", function (_) {
        frame.classList.add("drag");
    });
    fileInput.addEventListener("dragleave", function (_) {
        frame.classList.remove("drag");
    });
    fileInput.addEventListener("drop", function (_) {
        frame.classList.remove("drag");
    });
}
initDragAndDrop(webglFilesInput, webglFileFieldFrame);
initDragAndDrop(windowsFilesInput, windowsFileFieldFrame);
webglFilesInput.addEventListener("change", function (_) {
    return onFilesDropped("webgl", webglFilesInput);
});
windowsFilesInput.addEventListener("change", function (_) {
    return onFilesDropped("windows", windowsFilesInput);
});
function onMultipleFilesDropped(type, input) {
    var _a, _b, _c;
    var message = document.querySelector(".message-hidden-folder-files." + type);
    message.classList.add("hide");
    var dt = new DataTransfer();
    var files = (_a = input.files) !== null && _a !== void 0 ? _a : new FileList();
    Array.from(files)
        .filter(function (file) {
        var _a, _b;
        var directories = (_b = (_a = file.webkitRelativePath) === null || _a === void 0 ? void 0 : _a.split("/")) !== null && _b !== void 0 ? _b : [];
        return directories.find(function (dir) { return dir.startsWith("."); }) === undefined;
    })
        .forEach(function (file) {
        dt.items.add(file);
    });
    var fileCountBefore = (_c = (_b = input.files) === null || _b === void 0 ? void 0 : _b.length) !== null && _c !== void 0 ? _c : 0;
    var fileCountAfter = dt.files.length;
    if (fileCountBefore > fileCountAfter) {
        message.classList.remove("hide");
    }
    input.files = dt.files;
}
function onFilesDropped(type, input) {
    var _a, _b, _c;
    var preview = fileList.querySelector("." + type);
    preview.innerHTML = "" + type;
    var filePaths = [];
    if (input.webkitdirectory) {
        onMultipleFilesDropped(type, input);
        var files = (_a = input.files) !== null && _a !== void 0 ? _a : new FileList();
        Array.from(files).forEach(function (file) {
            filePaths.push(file.webkitRelativePath.replace(/^[^\/]+\//, ""));
        });
    }
    else {
        var files = (_b = input.files) !== null && _b !== void 0 ? _b : new FileList();
        filePaths.push((_c = files[0]) === null || _c === void 0 ? void 0 : _c.name);
    }
    filePaths.sort();
    filePaths.forEach(function (path) {
        var parent = preview;
        path.split("/").forEach(function (section) {
            var p_ul = Array.from(parent.childNodes).find(function (node) { return node.tagName === "UL"; });
            if (!p_ul) {
                p_ul = document.createElement("ul");
                parent.appendChild(p_ul);
            }
            var li = Array.from(p_ul.childNodes).find(function (node) { return node.tagName === "LI" && node.getAttribute("name") == section; });
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
creatorIdInput.addEventListener("change", function (_) {
    var creatorId = creatorIdInput.value;
    if (creatorId.length == 0) {
        creatorId = "(作者ID)";
    }
    var preview = document.querySelector(".file-list-header>.creator_id");
    preview.innerHTML = creatorId;
});
workIdInput.addEventListener("change", function (_) {
    var workId = workIdInput.value;
    if (workId.length == 0) {
        workId = "(作品ID)";
    }
    var preview = document.querySelector(".file-list-header>.work_id");
    preview.innerHTML = workId;
});
form.addEventListener("submit", function (event) {
    var _a, _b;
    event.preventDefault();
    if (((_a = webglFilesInput.files) === null || _a === void 0 ? void 0 : _a.length) === 0 &&
        ((_b = windowsFilesInput.files) === null || _b === void 0 ? void 0 : _b.length) === 0) {
        var content = document.createElement("div");
        content.textContent =
            "WebGLまたはWindowsのいずれかのファイルを選択してください";
        showMessageDialog("ファイルが選択されていません", content);
        return;
    }
    setUploading(true);
    var data = new FormData(form);
    var request = new XMLHttpRequest();
    request.open("POST", "", true);
    request.setRequestHeader("x-creator-id", creatorIdInput.value);
    request.setRequestHeader("x-work-id", workIdInput.value);
    request.addEventListener("load", function (ev) {
        var _a;
        setUploading(false);
        var title = request.status === 200
            ? "アップロードに成功しました"
            : "アップロードに失敗しました";
        var content = document.createElement("div");
        if (request.status === 200) {
            var paths = (_a = JSON.parse(request.response).paths) !== null && _a !== void 0 ? _a : [];
            paths
                .map(function (p) { return p.replace(/\\/g, "/"); })
                .forEach(function (p) {
                var url = "" + location.origin + p;
                var workUrlHolder = document.createElement("p");
                var workUrl = document.createElement("a");
                workUrl.href = url;
                workUrl.textContent = url;
                workUrlHolder.appendChild(workUrl);
                workUrlHolder.appendChild(document.createTextNode("にアップロードしました。"));
                content.appendChild(workUrlHolder);
            });
        }
        else if (request.status === 401) {
            content.appendChild(document.createTextNode("ログインしなおす必要があります。"));
            content.appendChild(document.createTextNode("ページを再読み込みしてください。"));
        }
        else {
            content.appendChild(document.createTextNode(request.response));
        }
        showMessageDialog(title, content);
    });
    request.send(data);
});
function alertBeforeLeave(event) {
    event.preventDefault();
    event.returnValue = "";
}
function setUploading(uploading) {
    if (uploading) {
        uploadButton.classList.add("disabled");
        uploadingIndicator.classList.remove("hide");
        window.addEventListener("beforeunload", alertBeforeLeave);
    }
    else {
        uploadButton.classList.remove("disabled");
        uploadingIndicator.classList.add("hide");
        window.removeEventListener("beforeunload", alertBeforeLeave);
    }
}
