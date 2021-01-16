import fs from "fs";
import path from "path";
import express from "express";
import multer from "multer";
const FIELD_WEBGL = "webgl";
const FIELD_WINDOWS = "windows";
const fields = [
  {
    name: FIELD_WEBGL,
  },
  {
    name: FIELD_WINDOWS,
    maxCount: 1,
  },
];
const DIRECTORY_UPLOADS_DESTINATION = "uploads";
const URL_PREFIX_GAME = "games";
function getUnityDir(req: express.Request): string {
  const creator_id = req.headers["x-creator-id"] as string;
  const game_id = req.headers["x-game-id"] as string;
  return path.join(creator_id, game_id);
}
function calculateTotalFileSize(
  files: {
    [fieldname: string]: Express.Multer.File[];
  },
  fields: { name: string }[]
): number {
  let totalFileSize = 0;
  fields.forEach(({ name }) =>
    (files[name] ?? []).forEach((file) => {
      totalFileSize += file.size;
    })
  );
  return totalFileSize;
}
const unityStorage = multer.diskStorage({
  destination: (req, file, next) => {
    const parentDir = path.join(
      DIRECTORY_UPLOADS_DESTINATION,
      getUnityDir(req),
      file.fieldname
    );
    if (file.fieldname == FIELD_WINDOWS) {
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      next(null, parentDir);
      return;
    }
    if (file.fieldname == FIELD_WEBGL) {
      const folders = path.dirname(file.originalname).split("/");
      folders.shift();
      const dir = path.join(parentDir, ...folders);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      next(null, dir);
      return;
    }
    next(new Error(`fieldname${file.fieldname}は不正です。`), "");
  },
  filename: function (req, file, callback) {
    callback(null, path.basename(file.originalname));
  },
});
const unityUpload = multer({
  storage: unityStorage,
  preservePath: true,
  fileFilter: (req, file, cb) => {
    if (file.fieldname == FIELD_WINDOWS) {
      cb(null, path.extname(file.originalname) === ".zip");
      return;
    }
    if (file.fieldname == FIELD_WEBGL) {
      const folders = path.dirname(file.originalname).split("/");
      //隠しフォルダ内のファイルではないか
      cb(null, !folders.find((f) => f.startsWith(".")));
      return;
    }
    cb(new Error(`fieldname${file.fieldname}は不正です。`));
  },
});

export {
  DIRECTORY_UPLOADS_DESTINATION,
  URL_PREFIX_GAME,
  getUnityDir,
  calculateTotalFileSize,
  unityUpload,
  FIELD_WEBGL,
  FIELD_WINDOWS,
  fields,
};
