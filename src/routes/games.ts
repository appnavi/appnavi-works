import path from "path";
import express from "express";
import serveIndex from "serve-index";
import {
  DIRECTORY_NAME_VIEWS,
  DIRECTORY_UPLOADS_DESTINATION,
} from "../utils/constants";
import { ejsToHtml } from "../utils/helpers";
const gamesRouter = express.Router();
gamesRouter.use(
  express.static(path.join(__dirname, "../..", DIRECTORY_UPLOADS_DESTINATION)),
  serveIndex(DIRECTORY_UPLOADS_DESTINATION, {
    template: (
      locals: serveIndex.Locals,
      callback: serveIndex.templateCallback
    ) => {
      ejsToHtml(
        path.join(__dirname, "../..", DIRECTORY_NAME_VIEWS, "games.ejs"),
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

export { gamesRouter };
