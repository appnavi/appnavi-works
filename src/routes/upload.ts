import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
//import jwt from "jsonwebtoken";
import { ensureAuthenticated } from "../services/auth";

const GAMES_DIRECTORY_NAME = "games";

const router = express.Router();

router.get("/", ensureAuthenticated, function (req, res) {
  res.render("upload");
});

//WebGLのアップロード
function getWebglDir(req: express.Request): string {
  const creator_id = req.headers['x-creator-id'] as string;
  const game_id = req.headers['x-game-id'] as string;
  return path.join(GAMES_DIRECTORY_NAME, creator_id, game_id, "webgl");
}
// function validateWebglUpload(
//   req: express.Request,
//   next: (error: Error | null, destination: string) => void
// ): boolean {
//   const body = req.body as Record<string, unknown>;
//   const validationParams = body["validationParams"] as string;
//   if (validationParams) {
//     const decoded = jwt.verify(
//       validationParams,
//       process.env["JWT_SECRET"] ?? ""
//     ) as { alreadyValidated: boolean };
//     if (decoded.alreadyValidated) {
//       return true;
//     }
//   }
//   const creatorId = body["creator_id"] as string;
//   const gameId = body["game_id"] as string;
//   if (
//     typeof creatorId !== "string" ||
//     creatorId.length == 0 ||
//     typeof gameId !== "string" ||
//     gameId.length == 0
//   ) {
//     next(new Error("作者IDまたはゲームIDが指定されていません。"), "");
//     return false;
//   }
//   const gameDir = path.join("uploads", getWebglDir(req));
//   if (fs.existsSync(gameDir)) {
//     if (body["overwrites_existing"] !== "on") {
//       next(
//         new Error(
//           "ゲームが既に存在しています。上書きする場合はチェックボックスにチェックを入れてください"
//         ),
//         ""
//       );
//       return false;
//     }
//   }

//   body["validationParams"] = jwt.sign(
//     { alreadyValidated: true },
//     process.env["JWT_SECRET"] ?? ""
//   );
//   return true;
// }
const webglStorage = multer.diskStorage({
  destination: (req, file, next) => {
    // const isValid = validateWebglUpload(req, next);
    // if (!isValid) {
    //   return;
    // }
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
  (req, res, next)=>{
    const creatorId = req.headers['x-creator-id'];
    const gameId = req.headers['x-game-id'];
    if(typeof creatorId !== 'string' || typeof gameId !== 'string' || creatorId.length == 0 || gameId.length == 0){
      res.status(500).send('作者IDまたはゲームIDが指定されていません。');
      return;
    }
    const gameDir = path.join("uploads", getWebglDir(req));
    if (fs.existsSync(gameDir)) {
      const overwritesExisting = req.headers['x-overwrites-existing'] as string;
      console.log(overwritesExisting);
      if (overwritesExisting !== "true") {
        res.status(500).send("ゲームが既に存在しています。上書きする場合はチェックボックスにチェックを入れてください");
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

export { router };
