import path from "path";
import ejs from "ejs";
import express from "express";
import serveIndex from "serve-index";
import { DIRECTORY_UPLOADS_DESTINATION } from "../services/upload";
const gamesRouter = express.Router();
const viewsDir = path.join(__dirname, "../../views");
gamesRouter.use(
  express.static(path.join(__dirname, "../..", DIRECTORY_UPLOADS_DESTINATION)),
  serveIndex(DIRECTORY_UPLOADS_DESTINATION, {
    template: (
      locals: serveIndex.Locals,
      callback: serveIndex.templateCallback
    ) => {
      ejs
        .renderFile(
          path.join(viewsDir, "games.ejs"),
          {
            ...locals,
          },
          {
            beautify: true,
          }
        )
        .then((str) =>
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
