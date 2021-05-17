import path from "path";
import express from "express";
import fsExtra from "fs-extra";
import multer from "multer";
import * as yup from "yup";
import { GameDocument, GameModel } from "../models/database";
import {
  DIRECTORY_UPLOADS_DESTINATION,
  MESSAGE_UNITY_UPLOAD_CREATOR_ID_REQUIRED as CREATOR_ID_REQUIRED,
  MESSAGE_UNITY_UPLOAD_CREATOR_ID_INVALID as CREATOR_ID_INVALID,
  MESSAGE_UNITY_UPLOAD_GAME_ID_REQUIRED as GAME_ID_REQUIRED,
  MESSAGE_UNITY_UPLOAD_GAME_ID_INVALID as GAME_ID_INVALID,
  HEADER_CREATOR_ID,
  HEADER_GAME_ID,
  DIRECTORY_NAME_BACKUPS,
} from "../utils/constants";
export const FIELD_WEBGL = "webgl";
export const FIELD_WINDOWS = "windows";
export const fields = [
  {
    name: FIELD_WEBGL,
  },
  {
    name: FIELD_WINDOWS,
    maxCount: 1,
  },
];

const idRegex = /^[0-9a-z-]+$/;
export const creatorIdSchema = yup
  .string()
  .matches(idRegex, CREATOR_ID_INVALID)
  .required(CREATOR_ID_REQUIRED);
export const gameIdSchema = yup
  .string()
  .matches(idRegex, GAME_ID_INVALID)
  .required(GAME_ID_REQUIRED);
export const uploadSchema = yup.object({
  creatorId: creatorIdSchema,
  gameId: gameIdSchema,
});

export function getCreatorId(req: express.Request): string {
  return req.headers[HEADER_CREATOR_ID] as string;
}
export function getGameId(req: express.Request): string {
  return req.headers[HEADER_GAME_ID] as string;
}
export function getUnityDir(req: express.Request): string {
  const creator_id = getCreatorId(req);
  const game_id = getGameId(req);
  return path.join(creator_id, game_id);
}
export async function findGameInDatabase(
  req: express.Request
): Promise<GameDocument | undefined> {
  const games = await GameModel.find({
    creatorId: getCreatorId(req),
    gameId: getGameId(req),
  });
  switch (games.length) {
    case 0:
      return undefined;
    case 1:
      return games[0];
    default:
      throw new Error("同じゲームが複数登録されています");
  }
}

export async function listBackupFolderNames(
  req: express.Request
): Promise<string[]> {
  const gameDir = path.join(DIRECTORY_UPLOADS_DESTINATION, getUnityDir(req));
  const backupFolderPath = path.resolve(DIRECTORY_NAME_BACKUPS, gameDir);
  const backupExists = await fsExtra.pathExists(backupFolderPath);
  if (!backupExists) {
    return [];
  }
  const filesInbackupFolder = await fsExtra.readdir(backupFolderPath, {
    withFileTypes: true,
  });
  return filesInbackupFolder
    .filter((it) => it.isDirectory())
    .map((it) => it.name);
}

export async function getLatestBackupIndex(
  req: express.Request
): Promise<number> {
  const backupFolderNames = await listBackupFolderNames(req);
  if (backupFolderNames.length == 0) {
    return 0;
  }
  backupFolderNames.sort();
  const latestBackupFolderName =
    backupFolderNames[backupFolderNames.length - 1];
  return parseInt(latestBackupFolderName);
}

export async function calculateCurrentStorageSizeBytes(): Promise<number> {
  const games = await GameModel.find();
  return games.reduce(
    (accumulator, currentValue) => accumulator + currentValue.totalFileSize,
    0
  );
}

export function calculateTotalFileSize(
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
  filename: function (_req, file, callback) {
    callback(null, path.basename(file.originalname));
  },
});
export const unityUpload = multer({
  storage: unityStorage,
  preservePath: true,
  fileFilter: (_req, file, cb) => {
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
