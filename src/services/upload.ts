import fs from "fs";
import path from "path";
import express from "express";
import multer from "multer";

const DIRECTORY_UPLOADS_DESTINATION = "uploads";
const URL_PREFIX_GAME = "games";
function getUnityDir(req: express.Request): string {
  const creator_id = req.headers["x-creator-id"] as string;
  const game_id = req.headers["x-game-id"] as string;
  return path.join(creator_id, game_id);
}
const unityStorage = multer.diskStorage({
  destination: (req, file, next) => {
    const folders = path.dirname(file.originalname).split("/");
    folders.shift();
    const dir = path.join(
      DIRECTORY_UPLOADS_DESTINATION,
      getUnityDir(req),
      file.fieldname,
      ...folders
    );
    if(!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
    }
    next(null, dir);
  },
  filename: function (req, file, callback) {
    callback(null, path.basename(file.originalname));
  },
});
const unityUpload = multer({
  storage: unityStorage,
  preservePath: true,
  fileFilter: (req, file, cb) => {
    const folders = path.dirname(file.originalname).split("/");
    //隠しフォルダ内のファイルではないか
    cb(null, !folders.find((f) => f.startsWith(".")));
  },
});

export {
  DIRECTORY_UPLOADS_DESTINATION,
  URL_PREFIX_GAME,
  getUnityDir,
  unityUpload,
};
