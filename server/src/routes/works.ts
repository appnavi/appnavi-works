import path from "path";
import express from "express";
import serveIndex from "serve-index";
import { absolutePathOfWorkFolder } from "../services/works";
import { DIRECTORY_NAME_VIEWS } from "../utils/constants";
import { ejsToHtml } from "../utils/helpers";
const worksRouter = express.Router();
worksRouter.use(
  (_req, res, next) => {
    res.removeHeader("x-frame-options");
    next();
  },
  express.static(absolutePathOfWorkFolder, {
    setHeaders: (res, path) => {
      // Brotli
      if (path.endsWith(".br")) {
        res.set("Content-Encoding", "br");
        if (path.endsWith(".js.br")) res.type("application/javascript");
        else if (path.endsWith(".wasm.br")) res.type("application/wasm");
        else res.type("application/octet-stream");
        return;
      }

      // Gzip
      if (path.endsWith(".gz")) {
        res.set("Content-Encoding", "gzip");
        if (path.endsWith(".js.gz")) res.type("application/javascript");
        else if (path.endsWith(".wasm.gz")) res.type("application/wasm");
        else res.type("application/octet-stream");
      }
    },
  }),
  serveIndex(absolutePathOfWorkFolder, {
    template: (
      locals: serveIndex.Locals,
      callback: serveIndex.TemplateCallback
    ) => {
      ejsToHtml(
        path.resolve(DIRECTORY_NAME_VIEWS, "works.ejs"),
        {
          ...locals,
        },
        {
          beautify: true,
        }
      )
        .then((str) =>
          // エラーが起きなかったら第一引数にnullを渡す仕様なのに、strictNullChecksで怒られるのでignore
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          callback(null, str)
        )
        .catch((e) => {
          callback(e);
        });
    },
  })
);

export { worksRouter };
