import path from "path";
import express from "express";
import fsExtra from "fs-extra";
import multer from "multer";
import { WorkDocument } from "../models/database";
import * as logger from "../modules/logger";
import {
  ensureAuthenticated,
  getDefaultCreatorId,
  getUserIdOrThrow,
  updateCreatorIds,
} from "../services/auth";
import { csrf } from "../services/csrf";
import {
  calculateWorkFileSize,
  uploadSchema,
  calculateCurrentStorageSizeBytes,
  backupWork,
  findOrCreateWork,
  isCreatorIdUsedByOtherUser,
} from "../services/works";
import {
  URL_PREFIX_WORK,
  DIRECTORY_NAME_UPLOADS,
  ERROR_MESSAGE_STORAGE_FULL as STORAGE_FULL,
  ERROR_MESSAGE_NO_FILES as NO_FILES,
  HEADER_CREATOR_ID,
  HEADER_WORK_ID,
  UPLOAD_UNITY_FIELD_WINDOWS,
  UPLOAD_UNITY_FIELD_WEBGL,
  UPLOAD_UNITY_FIELDS,
  ERROR_MESSAGE_CREATOR_ID_USED_BY_OTHER_USER as CREATOR_ID_USED_BY_OTHER_USER,
} from "../utils/constants";
import { env, getSiteURLWithoutTrailingSlash } from "../utils/env";
import { UploadError } from "../utils/errors";
import { render, wrap } from "../utils/helpers";

interface Locals {
  paths: string[];
  uploadStartedAt: Date;
  uploadEndedAt: Date;
  elapsedMillis: number;
  work: WorkDocument;
}
function getCreatorIdFromHeader(req: express.Request): string {
  return req.headers[HEADER_CREATOR_ID] as string;
}
function getWorkIdFromHeader(req: express.Request): string {
  return req.headers[HEADER_WORK_ID] as string;
}
const unityStorage = multer.diskStorage({
  destination: (req, file, next) => {
    (async () => {
      const parentDir = path.resolve(
        DIRECTORY_NAME_UPLOADS,
        getCreatorIdFromHeader(req),
        getWorkIdFromHeader(req),
        file.fieldname
      );
      let dir: string;
      switch (file.fieldname) {
        case UPLOAD_UNITY_FIELD_WINDOWS: {
          dir = parentDir;
          break;
        }
        case UPLOAD_UNITY_FIELD_WEBGL: {
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
export const unityUpload = multer({
  storage: unityStorage,
  preservePath: true,
  fileFilter: (_req, file, cb) => {
    switch (file.fieldname) {
      case UPLOAD_UNITY_FIELD_WINDOWS: {
        cb(null, path.extname(file.originalname) === ".zip");
        break;
      }
      case UPLOAD_UNITY_FIELD_WEBGL: {
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

if (process.env.NODE_ENV !== "test") {
  uploadRouter.use(csrf);
}

uploadRouter
  .route("/unity")
  .get(
    wrap(async function (req, res) {
      render("upload/unity", req, res, {
        defaultCreatorId: await getDefaultCreatorId(req),
        url: getSiteURLWithoutTrailingSlash(),
      });
    })
  )
  .post(
    validateParams,
    ensureStorageSpaceAvailable,
    preventCreatorIdUsedByMultipleUsers,
    getWorkDocument,
    validateDestination,
    beforeUpload,
    unityUpload.fields(UPLOAD_UNITY_FIELDS),
    ensureUploadSuccess,
    setLocals,
    saveToDatabase,
    logUploadSuccess,
    (_req, res) => {
      const locals = res.locals as Locals;
      res.json({
        paths: locals.paths,
      });
    }
  );

function validateParams(
  req: express.Request,
  _res: express.Response,
  next: express.NextFunction
) {
  const creatorId = getCreatorIdFromHeader(req);
  const workId = getWorkIdFromHeader(req);

  const parsed = uploadSchema.safeParse({
    creatorId: creatorId,
    workId: workId,
  });
  if (parsed.success) {
    next();
  } else {
    next(
      new UploadError(
        parsed.error.errors.map((x) => x.message),
        [creatorId, workId]
      )
    );
  }
}
function ensureStorageSpaceAvailable(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  return wrap(async (_req, _res, next) => {
    const workStorageSizeBytes = env.WORK_STORAGE_SIZE_BYTES;
    const currentStorageSizeBytes = await calculateCurrentStorageSizeBytes();
    if (workStorageSizeBytes <= currentStorageSizeBytes) {
      next(new UploadError([STORAGE_FULL]));
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
      getUserIdOrThrow(req)
    );
    next();
  })(req, res, next);
}
function preventCreatorIdUsedByMultipleUsers(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  return wrap(async (req, _res, next) => {
    const userId = getUserIdOrThrow(req);
    const creatorId = getCreatorIdFromHeader(req);
    const isUsedByOtherUser = await isCreatorIdUsedByOtherUser(
      creatorId,
      userId
    );
    if (isUsedByOtherUser) {
      next(new UploadError([CREATOR_ID_USED_BY_OTHER_USER]));
      return;
    }
    next();
  })(req, res, next);
}

function validateDestination(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  return wrap(async (req, res, next) => {
    const creatorId = getCreatorIdFromHeader(req);
    const workId = getWorkIdFromHeader(req);
    const workPath = path.resolve(DIRECTORY_NAME_UPLOADS, creatorId, workId);
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
    next(new UploadError([NO_FILES]));
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
  locals.paths = UPLOAD_UNITY_FIELDS.filter(
    ({ name }) => files[name] !== undefined
  ).map(({ name }) =>
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
    work.fileSize = calculateWorkFileSize(files, UPLOAD_UNITY_FIELDS);
    work.uploadedAt = locals.uploadEndedAt;
    await work.save();

    await updateCreatorIds(getUserIdOrThrow(req), getCreatorIdFromHeader(req));
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
