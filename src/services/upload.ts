import path from "path";
import express from "express";
import fsExtra from "fs-extra";
import { Document } from "mongoose";
import multer from "multer";
import { GameInfo } from "../models/database";
import { DIRECTORY_UPLOADS_DESTINATION } from "../utils/constants";
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
function getAuthorId(req: express.Request): string {
  return req.headers["x-creator-id"] as string;
}
function getGameId(req: express.Request): string {
  return req.headers["x-game-id"] as string;
}
function getUnityDir(req: express.Request): string {
  const creator_id = getAuthorId(req);
  const game_id = getGameId(req);
  return path.join(creator_id, game_id);
}
async function findGameInfo(
  req: express.Request
): Promise<Document | undefined> {
  const results = await new Promise<Document[]>((resolve, reject) => {
    GameInfo.find(
      {
        authorId: getAuthorId(req),
        gameId: getGameId(req),
      },
      (err, data) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(data);
      }
    );
  });
  switch (results.length) {
    case 0:
      return undefined;
    case 1:
      return results[0];
    default:
      throw new Error("同じゲームが複数登録されています");
  }
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
  destination: async (req, file, next) => {
    const parentDir = path.join(
      DIRECTORY_UPLOADS_DESTINATION,
      getUnityDir(req),
      file.fieldname
    );
    let dir: string;
    switch (file.fieldname) {
      case FIELD_WINDOWS: {
        dir = parentDir;
        break;
      }
      case FIELD_WEBGL: {
        const folders = path.dirname(file.originalname).split("/");
        folders.shift();
        dir = path.join(parentDir, ...folders);
        break;
      }
      default: {
        next(new Error(`fieldname${file.fieldname}は不正です。`), "");
        return;
      }
    }
    await fsExtra.ensureDir(dir);
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
    switch (file.fieldname) {
      case FIELD_WINDOWS: {
        cb(null, path.extname(file.originalname) === ".zip");
        break;
      }
      case FIELD_WEBGL: {
        const folders = path.dirname(file.originalname).split("/");
        //隠しフォルダ内のファイルではないか
        cb(null, !folders.find((f) => f.startsWith(".")));
        break;
      }
      default: {
        cb(new Error(`fieldname${file.fieldname}は不正です。`));
        return;
      }
    }
  },
});

export {
  getAuthorId,
  getGameId,
  getUnityDir,
  findGameInfo,
  calculateTotalFileSize,
  unityUpload,
  FIELD_WEBGL,
  FIELD_WINDOWS,
  fields,
};
