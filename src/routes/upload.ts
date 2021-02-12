import os from "os";
import path from "path";
import disk from "diskusage";
import express from "express";
import fsExtra from "fs-extra";
import { GameModel } from "../models/database";
import * as logger from "../modules/logger";
import { ensureAuthenticated, getDefaultCreatorId } from "../services/auth";
import {
  getUnityDir,
  calculateTotalFileSize,
  unityUpload,
  fields,
  getCreatorId,
  getGameId,
  findGameInDatabase,
  uploadSchema,
  getOverwritesExisting,
} from "../services/upload";
import {
  URL_PREFIX_GAME,
  DIRECTORY_UPLOADS_DESTINATION,
  DIRECTORY_NAME_BACKUPS,
} from "../utils/constants";
import { getContentSecurityPolicy, render } from "../utils/helpers";

interface Locals {
  uploadStartedAt: Date;
  uploadEndedAt: Date;
  elapsedMillis: number;
  creatorId: string;
  gameId: string;
  createdBy: string;
  paths: string[];
  totalFileSize: number;
}
class UploadError extends Error {
  constructor(message: string, public params: unknown[]) {
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
    });
  })
  .post(
    validateParams,
    preventEditByOtherPerson,
    validateDestination,
    ensureDiskSpaceAvailable,
    beforeUpload,
    unityUpload.fields(fields),
    ensureUploadSuccess,
    createMetadata,
    saveToDatabase,
    logUploadSuccess,
    (req, res) => {
      const locals = res.locals as Locals;
      res.send({
        paths: locals.paths,
      });
    }
  );

uploadRouter.use(function (
  err: NodeJS.Dict<unknown>,
  req: express.Request,
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
  res.status(500).send(err.message);
});

function validateParams(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const creatorId = getCreatorId(req);
  const gameId = getGameId(req);
  const overwritesExisting = getOverwritesExisting(req);

  uploadSchema
    .validate({
      creatorId: creatorId,
      gameId: gameId,
      overwritesExisting,
    })
    .then(() => {
      next();
    })
    .catch((err: { name: string; errors: string[] }) => {
      next(
        new UploadError(err.errors[0], [creatorId, gameId, overwritesExisting])
      );
    });
}
async function preventEditByOtherPerson(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const gameDocument = await findGameInDatabase(req);
  if (gameDocument === undefined) {
    next();
    return;
  }
  const game = gameDocument.toObject() as Record<string, unknown>;
  const createdBy = game["createdBy"];
  if (createdBy === req.user?.user.id) {
    next();
    return;
  }
  next(
    new UploadError(
      `別の人が既に投稿したゲームがあります。上書きすることはできません。`,
      [getUnityDir(req)]
    )
  );
}
async function validateDestination(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const gameDir = path.join(DIRECTORY_UPLOADS_DESTINATION, getUnityDir(req));
  const exists = await fsExtra.pathExists(gameDir);
  if (exists) {
    if (!getOverwritesExisting(req)) {
      next(
        new UploadError(
          "ゲームが既に存在しています。上書きする場合はチェックボックスにチェックを入れてください",
          [gameDir]
        )
      );
      return;
    }
    await fsExtra.move(gameDir, path.join(DIRECTORY_NAME_BACKUPS, gameDir), {
      overwrite: true,
    });
  }
  next();
}
function ensureDiskSpaceAvailable(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const path = os.platform() === "win32" ? "c:" : "/";
  disk.check(path, (err, info) => {
    //1024^3 B = 1GB以上のスペースがあればアップロードを許可
    if ((info?.available ?? 0) >= Math.pow(1024, 3)) {
      next();
      return;
    }
    next({
      message: "スペースが十分ではありません",
    });
  });
}
function beforeUpload(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const locals = res.locals as Locals;
  locals.uploadStartedAt = new Date();
  next();
}
function ensureUploadSuccess(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  if (Object.keys(req.files ?? {}).length === 0) {
    next({
      message: "アップロードするファイルがありません。",
    });
    return;
  }
  next();
}
function createMetadata(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const locals = res.locals as Locals;
  const uploadStartedAt = locals.uploadStartedAt;
  const uploadEndedAt = new Date();
  const files = req.files as {
    [fieldname: string]: Express.Multer.File[];
  };
  res.locals = {
    uploadStartedAt: uploadStartedAt,
    uploadEndedAt: uploadEndedAt,
    elapsedMillis: uploadEndedAt.getTime() - uploadStartedAt.getTime(),
    creatorId: getCreatorId(req),
    gameId: getGameId(req),
    createdBy: req.user?.user.id ?? "",
    paths: fields
      .filter(({ name }) => {
        const files = req.files as {
          [fieldname: string]: Express.Multer.File[];
        };
        return files[name] !== undefined;
      })
      .map(({ name }) => path.join(URL_PREFIX_GAME, getUnityDir(req), name)),
    totalFileSize: calculateTotalFileSize(files, fields),
  } as Locals;
  next();
}
function saveToDatabase(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const locals = res.locals as Locals;
  GameModel.updateOne(
    {
      creatorId: locals.creatorId,
      gameId: locals.gameId,
    },
    {
      $set: locals,
    },
    { upsert: true },
    (err) => {
      if (err) {
        next(err);
        return;
      }
      next();
    }
  );
}
function logUploadSuccess(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const locals = res.locals as Locals;
  logger.system.info("アップロード成功", locals);
  next();
}
export { uploadRouter };
