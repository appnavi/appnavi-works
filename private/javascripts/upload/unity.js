"use strict";
var webglFilesInput = document.querySelector('input[name="webgl"]');
var windowsFilesInput = document.querySelector('input[name="windows"]');
var webglFileFieldFrame = document.querySelector(".input-field.file-field-frame.webgl");
var windowsFileFieldFrame = document.querySelector(".input-field.file-field-frame.windows");
var fileList = document.querySelector(".file-list");
var creatorIdInput = document.querySelector('input[name="creator_id"]');
var gameIdInput = document.querySelector('input[name="game_id"]');
var form = document.querySelector("form");
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
    M.Modal.init(document.querySelector("#result-dialog"), {});
});
function initDragAndDrop(fileInput, frame) {
    fileInput.addEventListener("dragenter", function (event) {
        frame.classList.add("drag");
    });
    fileInput.addEventListener("dragleave", function (event) {
        frame.classList.remove("drag");
    });
    fileInput.addEventListener("drop", function (event) {
        frame.classList.remove("drag");
    });
}
initDragAndDrop(webglFilesInput, webglFileFieldFrame);
initDragAndDrop(windowsFilesInput, windowsFileFieldFrame);
webglFilesInput.addEventListener("change", function (event) {
    return onFilesDropped("webgl", webglFilesInput);
});
windowsFilesInput.addEventListener("change", function (event) {
    return onFilesDropped("windows", windowsFilesInput);
});
function onMultipleFilesDropped(type, input) {
    var _a, _b, _c;
    var message = document.querySelector(".message-hidden-folder-files." + type);
    message.classList.add("hide");
    var dt = new DataTransfer();
    Array.from((_a = input.files) !== null && _a !== void 0 ? _a : new FileList())
        .filter(function (file) {
        var directories = file.webkitRelativePath.split("/");
        return directories.find(function (dir) { return dir.startsWith("."); }) === undefined;
    })
        .forEach(function (file) {
        dt.items.add(file);
    });
    var fileCountBefore = (_c = (_b = input.files) === null || _b === void 0 ? void 0 : _b.length) !== null && _c !== void 0 ? _c : [];
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
        Array.from((_a = input.files) !== null && _a !== void 0 ? _a : new FileList()).forEach(function (file) {
            filePaths.push(file.webkitRelativePath.replace(/^[^\/]+\//, ""));
        });
    }
    else {
        filePaths.push((_c = ((_b = input.files) !== null && _b !== void 0 ? _b : [])[0]) === null || _c === void 0 ? void 0 : _c.name);
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
creatorIdInput.addEventListener("change", function (ev) {
    var creatorId = creatorIdInput.value;
    if (creatorId.length == 0) {
        creatorId = "(作者ID)";
    }
    document.querySelector(".file-list-header>.creator_id").innerHTML = creatorId;
});
gameIdInput.addEventListener("change", function (ev) {
    var gameId = gameIdInput.value;
    if (gameId.length == 0) {
        gameId = "(ゲームID)";
    }
    document.querySelector(".file-list-header>.game_id").innerHTML = gameId;
});
form.addEventListener("submit", function (event) {
    var _a, _b;
    event.preventDefault();
    if (((_a = webglFilesInput.files) === null || _a === void 0 ? void 0 : _a.length) === 0 &&
        ((_b = windowsFilesInput.files) === null || _b === void 0 ? void 0 : _b.length) === 0) {
        return;
    }
    setUploading(true);
    var data = new FormData(form);
    var request = new XMLHttpRequest();
    request.open("POST", "", true);
    request.setRequestHeader("x-creator-id", creatorIdInput.value);
    request.setRequestHeader("x-game-id", gameIdInput.value);
    request.setRequestHeader("x-overwrites-existing", document.querySelector('input[name="overwrites_existing"]').checked.toString());
    request.addEventListener("load", function (ev) {
        var _a, _b;
        setUploading(false);
        var content = "<h4>" + (request.status === 200
            ? "アップロードに成功しました"
            : "アップロードに失敗しました") + "</h4>";
        if (request.status === 200) {
            var paths = (_b = (_a = JSON.parse(request.response).paths) === null || _a === void 0 ? void 0 : _a.map(function (p) {
                return p.replace(/\\/g, "/");
            })) !== null && _b !== void 0 ? _b : [];
            if (paths.length > 0) {
                paths.forEach(function (p) {
                    var url = "" + location.origin + p;
                    content += "<p><a href=\"" + url + "\">" + url + "</a>\u306B\u30A2\u30C3\u30D7\u30ED\u30FC\u30C9\u3057\u307E\u3057\u305F\u3002</p>";
                });
            }
        }
        else if (request.status === 401) {
            content +=
                "<p>ログインしなおす必要があります。</p><p>ページを再読み込みしてください</>";
        }
        else {
            content += request.response;
        }
        var dialog = document.querySelector("#result-dialog");
        dialog.querySelector(".modal-content").innerHTML = content;
        M.Modal.getInstance(dialog).open();
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
