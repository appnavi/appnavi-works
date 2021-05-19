import path from "path";
import express from "express";
import fsExtra from "fs-extra";
import multer from "multer";
import { WorkDocument } from "../models/database";
import * as logger from "../modules/logger";
import {
  ensureAuthenticated,
  getDefaultCreatorId,
  getUserId,
} from "../services/auth";
import {
  calculateWorkFileSize,
  uploadSchema,
  calculateCurrentStorageSizeBytes,
  backupWork,
  findOrCreateWork,
} from "../services/works";
import {
  URL_PREFIX_WORK,
  DIRECTORY_UPLOADS_DESTINATION,
  ERROR_MESSAGE_DIFFERENT_USER as DIFFERENT_USER,
  ERROR_MESSAGE_STORAGE_FULL as STORAGE_FULL,
  ERROR_MESSAGE_NO_FILES as NO_FILES,
  STATUS_CODE_BAD_REQUEST,
  HEADER_CREATOR_ID,
  HEADER_WORK_ID,
} from "../utils/constants";
import { getEnv, getEnvNumber, render, wrap } from "../utils/helpers";

interface Locals {
  paths: string[];
  uploadStartedAt: Date;
  uploadEndedAt: Date;
  elapsedMillis: number;
  work: WorkDocument;
}
class UploadError extends Error {
  constructor(message: string, public params: unknown[] = []) {
    super(message);
    this.name = new.target.name;
    // 下記の行はTypeScriptの出力ターゲットがES2015より古い場合(ES3, ES5)のみ必要
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
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
function getCreatorIdFromHeader(req: express.Request): string {
  return req.headers[HEADER_CREATOR_ID] as string;
}
function getWorkIdFromHeader(req: express.Request): string {
  return req.headers[HEADER_WORK_ID] as string;
}
const unityStorage = multer.diskStorage({
  destination: (req, file, next) => {
    (async () => {
      const parentDir = path.join(
        DIRECTORY_UPLOADS_DESTINATION,
        getCreatorIdFromHeader(req),
        getWorkIdFromHeader(req),
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
    })().catch((err) => next(err, ""));
  },
  filename: function (_req, file, callback) {
    callback(null, path.basename(file.originalname));
  },
});
const unityUpload = multer({
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

const uploadRouter = express.Router();
uploadRouter.use(ensureAuthenticated);

uploadRouter
  .route("/unity")
  .get(
    wrap(async function (req, res) {
      render("upload/unity", req, res, {
        defaultCreatorId: await getDefaultCreatorId(req),
        url: getEnv("SITE_URL"),
      });
    })
  )
  .post(
    validateParams,
    ensureStorageSpaceAvailable,
    getWorkDocument,
    preventEditByOtherPerson,
    validateDestination,
    beforeUpload,
    unityUpload.fields(fields),
    ensureUploadSuccess,
    setLocals,
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
  const creatorId = getCreatorIdFromHeader(req);
  const workId = getWorkIdFromHeader(req);

  uploadSchema
    .validate({
      creatorId: creatorId,
      workId: workId,
    })
    .then(() => {
      next();
    })
    .catch((err: { name: string; errors: string[] }) => {
      next(new UploadError(err.errors[0], [creatorId, workId]));
    });
}
function ensureStorageSpaceAvailable(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  return wrap(async (_req, _res, next) => {
    const workStorageSizeBytes = getEnvNumber("WORK_STORAGE_SIZE_BYTES");
    const currentStorageSizeBytes = await calculateCurrentStorageSizeBytes();
    if (workStorageSizeBytes <= currentStorageSizeBytes) {
      next(new UploadError(STORAGE_FULL));
      return;
    }
    next();
  })(req, res, next);
}
function getWorkDocument(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  return wrap(async (req, res, next) => {
    const locals = res.locals as Locals;
    locals.work = await findOrCreateWork(
      getCreatorIdFromHeader(req),
      getWorkIdFromHeader(req),
      getUserId(req) ?? ""
    );
    next();
  })(req, res, next);
}
function preventEditByOtherPerson(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const locals = res.locals as Locals;
  const owner = locals.work.owner;
  if (owner === getUserId(req)) {
    next();
    return;
  }
  next(
    new UploadError(DIFFERENT_USER, [
      path.join(getCreatorIdFromHeader(req), getWorkIdFromHeader(req)),
    ])
  );
}
function validateDestination(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  return wrap(async (req, res, next) => {
    const creatorId = getCreatorIdFromHeader(req);
    const workId = getWorkIdFromHeader(req);
    const workDir = path.join(DIRECTORY_UPLOADS_DESTINATION, creatorId, workId);
    const workPath = path.resolve(workDir);
    const exists = await fsExtra.pathExists(workPath);
    if (!exists) {
      next();
      return;
    }
    const locals = res.locals as Locals;
    await backupWork(creatorId, workId, locals.work);
    next();
  })(req, res, next);
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
function setLocals(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const locals = res.locals as Locals;
  const uploadStartedAt = locals.uploadStartedAt;
  locals.uploadEndedAt = new Date();
  locals.elapsedMillis =
    locals.uploadEndedAt.getTime() - uploadStartedAt.getTime();

  const files = req.files as {
    [fieldname: string]: Express.Multer.File[];
  };
  locals.paths = fields
    .filter(({ name }) => files[name] !== undefined)
    .map(({ name }) =>
      path.join(
        URL_PREFIX_WORK,
        getCreatorIdFromHeader(req),
        getWorkIdFromHeader(req),
        name
      )
    );
  next();
}
function saveToDatabase(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  return wrap(async (req, res, next) => {
    const locals = res.locals as Locals;
    const work = locals.work;
    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };
    work.fileSize = calculateWorkFileSize(files, fields);
    work.uploadedAt = locals.uploadEndedAt;
    await work.save();
    next();
  })(req, res, next);
}
function logUploadSuccess(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const locals = res.locals as Locals;
  logger.system.info("アップロード成功", {
    creatorId: getCreatorIdFromHeader(req),
    workId: getWorkIdFromHeader(req),
    uploadStartedAt: locals.uploadStartedAt,
    uploadEndedAt: locals.uploadEndedAt,
    elapsedMillis: locals.elapsedMillis,
  });
  next();
}
export { uploadRouter };
