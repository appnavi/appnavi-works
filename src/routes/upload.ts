import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { ensureAuthenticated } from "../services/auth";
import * as logger from "../modules/logger";

const DIRECTORY_UPLOADS_DESTINATION = "uploads";
const URL_PREFIX_GAME = "games";

const router = express.Router();

router.get("/", ensureAuthenticated, function (req, res) {
  res.render("upload");
});

router.use(
  ensureAuthenticated,
  express.static(path.join(__dirname, '../../privates/upload'))
);

//WebGLのアップロード
function getWebglDir(req: express.Request): string {
  const creator_id = req.headers["x-creator-id"] as string;
  const game_id = req.headers["x-game-id"] as string;
  return path.join(creator_id, game_id, "webgl");
}

const webglStorage = multer.diskStorage({
  destination: (req, file, next) => {
    const folders = path.dirname(file.originalname).split("/");
    folders.shift();
    const dir = path.join(
      DIRECTORY_UPLOADS_DESTINATION,
      getWebglDir(req),
      ...folders
    );
    fs.mkdirSync(dir, { recursive: true });
    next(null, dir);
  },
  filename: function (req, file, callback) {
    callback(null, path.basename(file.originalname));
  },
});
const webglUpload = multer({
  storage: webglStorage,
  preservePath: true,
  fileFilter: (req, file, cb) => {
    const folders = path.dirname(file.originalname).split("/");
    //隠しフォルダが含まれていないか
    cb(null, !folders.find((f) => f.startsWith(".")));
  },
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
router.post(
  "/webgl",
  ensureAuthenticated,
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

export { router, DIRECTORY_UPLOADS_DESTINATION, URL_PREFIX_GAME };
