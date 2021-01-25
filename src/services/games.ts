import fs from "fs";
import escapeHtml from "escape-html";
import express from "express";
import serveIndex from "serve-index";


function directoryBreadcrumbs(directory: string): string {
  const directoryParts = directory.split("/").filter((p) => p.length > 0);
  return directoryParts
    .map((part, i) => {
      const link = `/${directoryParts.slice(0, i + 1).join("/")}`;
      return `<a class="breadcrumb" href="${link}">${part}</a>`;
    })
    .join("\n");
}
function fileCards(directory: string, files: serveIndex.File[]): string {
  if (files[0].name === "..") {
    files.shift();
  }
  return files
    .map((f) => {
      const icon = f.stat.isDirectory()
        ? '<i class="fas fa-folder fa-10x"></i>'
        : '<i class="fas fa-file fa-10x"></i>';
      return `
        <div class="col s3 center">
          <a href="${directory}${f.name}">
            <div class="card">
              <div class="card-image">
                ${icon}
              </div>
              <span class="card-title">
                ${f.name}
              </span>
            </div>
          </a>
        </div>
        `;
    })
    .join("\n");
}

function renderTemplate(
  locals: serveIndex.Locals,
  callback: serveIndex.templateCallback
) {
  fs.readFile("serve-index-directory.html", "utf8", (err, str) => {
    if (err) return callback(err);
    const body = str
      .replace(/\{linked-path\}/g, directoryBreadcrumbs(locals.directory))
      .replace(/\{files\}/g, fileCards(locals.directory, locals.fileList))
      .replace(/\{directory\}/g, escapeHtml(locals.directory));
    callback(null, body);
  });
}

function serveGamesIndex(path: string):express.Handler{
  return serveIndex(path, {
    template: renderTemplate,
  });
}

export { serveGamesIndex };
