import path from "path";
import express from "express";
import fsExtra from "fs-extra";
import { GameDocument } from "../models/database";
import * as logger from "../modules/logger";
import { ensureAuthenticated, getDefaultCreatorId } from "../services/auth";
import {
  getUnityDir,
  calculateTotalFileSize,
  unityUpload,
  fields,
  getCreatorId,
  getGameId,
  uploadSchema,
  calculateCurrentStorageSizeBytes,
  backupGame,
  findOrCreateGame,
} from "../services/games";
import {
  URL_PREFIX_GAME,
  DIRECTORY_UPLOADS_DESTINATION,
  MESSAGE_UNITY_UPLOAD_DIFFERENT_USER as DIFFERENT_USER,
  MESSAGE_UNITY_UPLOAD_STORAGE_FULL as STORAGE_FULL,
  MESSAGE_UNITY_UPLOAD_NO_FILES as NO_FILES,
  STATUS_CODE_BAD_REQUEST,
} from "../utils/constants";
import {
  getContentSecurityPolicy,
  getEnv,
  getEnvNumber,
  render,
} from "../utils/helpers";

interface Locals {
  paths: string[];
  uploadStartedAt: Date;
  game: GameDocument;
}
class UploadError extends Error {
  constructor(message: string, public params: unknown[] = []) {
    super(message);
    this.name = new.target.name;
    // 下記の行はTypeScriptの出力ターゲットがES2015より古い場合(ES3, ES5)のみ必要
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

const uploadRouter = express.Router();
uploadRouter.use(ensureAuthenticated);
uploadRouter.use(getContentSecurityPolicy());

uploadRouter
  .route("/unity")
  .get(async function (req, res) {
    render("upload/unity", req, res, {
      defaultCreatorId: await getDefaultCreatorId(req),
      url: getEnv("SITE_URL"),
    });
  })
  .post(
    validateParams,
    ensureStorageSpaceAvailable,
    getGameDocument,
    preventEditByOtherPerson,
    validateDestination,
    beforeUpload,
    unityUpload.fields(fields),
    ensureUploadSuccess,
    saveToDatabase,
    logUploadSuccess,
    (_req, res) => {
      const locals = res.locals as Locals;
      res.send({
        paths: locals.paths,
      });
    }
  );

uploadRouter.use(function (
  err: NodeJS.Dict<unknown>,
  _req: express.Request,
  res: express.Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: express.NextFunction //この引数を省略すると、views/error.ejsが描画されなくなる
) {
  if (!(err instanceof UploadError)) {
    next(err);
    return;
  }
  const params = err.params;
  logger.system.error(`アップロード失敗：${err.message}`, ...params);
  res.status(STATUS_CODE_BAD_REQUEST).send(err.message);
});

function validateParams(
  req: express.Request,
  _res: express.Response,
  next: express.NextFunction
) {
  const creatorId = getCreatorId(req);
  const gameId = getGameId(req);

  uploadSchema
    .validate({
      creatorId: creatorId,
      gameId: gameId,
    })
    .then(() => {
      next();
    })
    .catch((err: { name: string; errors: string[] }) => {
      next(new UploadError(err.errors[0], [creatorId, gameId]));
    });
}
async function ensureStorageSpaceAvailable(
  _req: express.Request,
  _res: express.Response,
  next: express.NextFunction
) {
  const gameStorageSizeBytes = getEnvNumber("GAME_STORAGE_SIZE_BYTES");
  const currentStorageSizeBytes = await calculateCurrentStorageSizeBytes();
  if (gameStorageSizeBytes <= currentStorageSizeBytes) {
    next(new UploadError(STORAGE_FULL));
    return;
  }
  next();
}
async function getGameDocument(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const locals = res.locals as Locals;
  locals.game = await findOrCreateGame(req);
  next();
}
function preventEditByOtherPerson(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const locals = res.locals as Locals;
  const createdBy = locals.game.createdBy;
  if (createdBy === req.user?.user.id) {
    next();
    return;
  }
  next(new UploadError(DIFFERENT_USER, [getUnityDir(req)]));
}
async function validateDestination(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const gameDir = path.join(DIRECTORY_UPLOADS_DESTINATION, getUnityDir(req));
  const gamePath = path.resolve(gameDir);
  const exists = await fsExtra.pathExists(gamePath);
  if (!exists) {
    next();
    return;
  }
  const locals = res.locals as Locals;
  await backupGame(req, locals.game);
  next();
}
function beforeUpload(
  _req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const locals = res.locals as Locals;
  locals.uploadStartedAt = new Date();
  next();
}
function ensureUploadSuccess(
  req: express.Request,
  _res: express.Response,
  next: express.NextFunction
) {
  if (Object.keys(req.files ?? {}).length === 0) {
    next(new UploadError(NO_FILES));
    return;
  }
  next();
}
async function saveToDatabase(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const locals = res.locals as Locals;
  const game = locals.game;
  const files = req.files as {
    [fieldname: string]: Express.Multer.File[];
  };
  locals.paths = fields
    .filter(({ name }) => files[name] !== undefined)
    .map(({ name }) => path.join(URL_PREFIX_GAME, getUnityDir(req), name));
  game.totalFileSize = calculateTotalFileSize(files, fields);
  await game.save();
  next();
}
function logUploadSuccess(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const locals = res.locals as Locals;
  const uploadStartedAt = locals.uploadStartedAt;
  const uploadEndedAt = new Date();
  const elapsedMillis = uploadEndedAt.getTime() - uploadStartedAt.getTime();
  logger.system.info("アップロード成功", {
    creatorId: getCreatorId(req),
    gameId: getGameId(req),
    uploadStartedAt,
    uploadEndedAt,
    elapsedMillis,
  });
  next();
}
export { uploadRouter };
