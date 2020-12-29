import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { ensureAuthenticated } from "../services/auth";

const DIRECTORY_UPLOADS_DESTINATION = "uploads";
const GAMES_DIRECTORY_NAME = "games";

const router = express.Router();

router.get("/", ensureAuthenticated, function (req, res) {
  res.render("upload");
});

//WebGLのアップロード
function getWebglDir(req: express.Request): string {
  const creator_id = req.headers["x-creator-id"] as string;
  const game_id = req.headers["x-game-id"] as string;
  return path.join(GAMES_DIRECTORY_NAME, creator_id, game_id, "webgl");
}

const webglStorage = multer.diskStorage({
  destination: (req, file, next) => {
    const folders = path.dirname(file.originalname).split("/");
    folders.shift();
    const dir = path.join(DIRECTORY_UPLOADS_DESTINATION, getWebglDir(req), ...folders);
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

router.post(
  "/webgl",
  ensureAuthenticated,
  (req, res, next) => {
    const creatorId = req.headers["x-creator-id"];
    const gameId = req.headers["x-game-id"];
    if (
      typeof creatorId !== "string" ||
      typeof gameId !== "string" ||
      creatorId.length == 0 ||
      gameId.length == 0
    ) {
      res.status(500).send("作者IDまたはゲームIDが指定されていません。");
      return;
    }
    const gameDir = path.join(DIRECTORY_UPLOADS_DESTINATION, getWebglDir(req));
    if (fs.existsSync(gameDir)) {
      const overwritesExisting = req.headers["x-overwrites-existing"] as string;
      if (overwritesExisting !== "true") {
        res
          .status(500)
          .send(
            "ゲームが既に存在しています。上書きする場合はチェックボックスにチェックを入れてください"
          );
        return;
      }
    }
    next();
  },
  webglUpload.array("game"),
  function (req, res) {
    const files = req.files;
    if (!(files instanceof Array)) {
      res.status(400).end();
      return;
    }
    const fileCounts = files.length;
    if (fileCounts === 0) {
      res.status(500).send("アップロードするファイルがありません。");
      return;
    }
    res.send({
      path: `/${getWebglDir(req)}`,
    });
  }
);

export { router, DIRECTORY_UPLOADS_DESTINATION };
