import path from "path";
import express from "express";
import serveIndex from "serve-index";
import {
  DIRECTORY_NAME_VIEWS,
  DIRECTORY_NAME_UPLOADS,
} from "../utils/constants";
import { ejsToHtml } from "../utils/helpers";
const worksRouter = express.Router();
worksRouter.use(
  (_req, res, next) => {
    res.removeHeader("x-frame-options");
    next();
  },
  express.static(path.resolve(DIRECTORY_NAME_UPLOADS)),
  serveIndex(DIRECTORY_NAME_UPLOADS, {
    template: (
      locals: serveIndex.Locals,
      callback: serveIndex.templateCallback
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
