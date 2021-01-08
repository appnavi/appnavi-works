import fs from "fs";
import path from "path";
import express from "express";
import { getContentSecurityPolicy } from "../helpers";
import * as logger from "../modules/logger";
import { ensureAuthenticated } from "../services/auth";
import {
  DIRECTORY_UPLOADS_DESTINATION,
  URL_PREFIX_GAME,
  getWebglDir,
  webglUpload,
} from "../services/upload";

const uploadRouter = express.Router();
uploadRouter.use(getContentSecurityPolicy());
uploadRouter.use(ensureAuthenticated);
uploadRouter.use(express.static(path.join(__dirname, "../../privates/upload")));
uploadRouter.get("/", function (req, res) {
  res.render("upload");
});

function validateParams(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const creatorId = req.headers["x-creator-id"];
  const gameId = req.headers["x-game-id"];
  if (
    typeof creatorId !== "string" ||
    typeof gameId !== "string" ||
    creatorId.length == 0 ||
    gameId.length == 0
  ) {
    logger.system.error(
      "アップロード失敗:作者IDとゲームIDを両方を指定する必要があります。",
      creatorId,
      gameId
    );
    res.status(500).send("作者IDとゲームIDを両方を指定する必要があります。");
    return;
  }
  if (!/^[0-9a-z-]+$/.test(creatorId) || !/^[0-9a-z-]+$/.test(gameId)) {
    logger.system.error(
      "アップロード失敗:作者IDおよびゲームIDは数字・アルファベット小文字・ハイフンのみ使用できます。",
      creatorId,
      gameId
    );
    res
      .status(500)
      .send(
        "作者IDおよびゲームIDは数字・アルファベット小文字・ハイフンのみ使用できます。"
      );
    return;
  }
  const gameDir = path.join(DIRECTORY_UPLOADS_DESTINATION, getWebglDir(req));
  if (fs.existsSync(gameDir)) {
    const overwritesExisting = req.headers["x-overwrites-existing"] as string;
    if (overwritesExisting !== "true") {
      logger.system.error(
        "アップロード失敗:ゲームが既に存在しています。",
        gameDir
      );
      res
        .status(500)
        .send(
          "ゲームが既に存在しています。上書きする場合はチェックボックスにチェックを入れてください"
        );
      return;
    }
  }
  next();
}
uploadRouter.post(
  "/webgl",
  validateParams,
  (req, res, next) => {
    res.locals["uploadStartedAt"] = new Date();
    next();
  },
  webglUpload.array("game"),
  (req, res) => {
    const files = req.files ?? [];
    if (!(files instanceof Array)) {
      logger.system.error(
        "アップロード失敗:想定外のエラーです。(express.Request.filesの型が不正です)",
        files
      );
      res.status(400).end();
      return;
    }

    const fileCounts = files.length;
    if (fileCounts === 0) {
      logger.system.error(
        "アップロード失敗:アップロードするファイルがありません。"
      );
      res.status(500).send("アップロードするファイルがありません。");
      return;
    }

    const uploadStartedAt = res.locals["uploadStartedAt"] as Date;
    const uploadEndedAt = new Date();
    const elapsedMillis = uploadEndedAt.getTime() - uploadStartedAt.getTime();

    const totalFileSize = files.reduce((acc, value) => {
      return acc + value.size;
    }, 0);

    const dir = getWebglDir(req);
    logger.system.info(
      "アップロード成功",
      dir,
      `${elapsedMillis}ms`,
      `${totalFileSize}bytes`
    );
    res.send({
      path: `/${path.join(URL_PREFIX_GAME, dir)}`,
    });
  }
);

export { uploadRouter };
