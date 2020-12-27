import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
import { ensureAuthenticated } from "../services/auth";

const router = express.Router();

router.get("/", ensureAuthenticated, function (req, res, _) {
  res.render("upload");
});

//WebGLのアップロード
function getWebglDir(req: express.Request): string {
  const creator_id = req.body["creator_id"];
  const game_id = req.body["game_id"];
  return path.join(creator_id, game_id, "webgl");
}
function validateWebglUpload(
  req: express.Request,
  next: (error: Error | null, destination: string) => void
): boolean {
  const validationParams = req.body["validationParams"];
  if (validationParams) {
    const decoded: any = jwt.verify(
      validationParams,
      process.env["JWT_SECRET"] ?? ""
    );
    if (decoded.alreadyValidated) {
      return true;
    }
  }
  const creatorId = req.body["creator_id"];
  const gameId = req.body["game_id"];
  if (
    typeof creatorId !== "string" ||
    creatorId.length == 0 ||
    typeof gameId !== "string" ||
    gameId.length == 0
  ) {
    next(new Error("作者IDまたはゲームIDが指定されていません。"), "");
    return false;
  }
  const gameDir = getWebglDir(req);
  if (fs.existsSync(gameDir)) {
    if (req.body["overwrites_existing"] !== "on") {
      next(
        new Error(
          "ゲームが既に存在しています。上書きする場合はチェックボックスにチェックを入れてください"
        ),
        ""
      );
      return false;
    }
  }

  req.body["validationParams"] = jwt.sign(
    { alreadyValidated: true },
    process.env["JWT_SECRET"] ?? ""
  );
  return true;
}
const webglStorage = multer.diskStorage({
  destination: (req, file, next) => {
    const isValid = validateWebglUpload(req, next);
    if (!isValid) {
      return;
    }
    const folders = path.dirname(file.originalname).split("/");
    folders.shift();
    const dir = path.join("uploads", getWebglDir(req), ...folders);
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
  webglUpload.array("game"),
  function (req, res, _) {
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
    res.render("upload-success", {
      path: `/games/${getWebglDir(req)}`,
    });
  }
);

export { router };
