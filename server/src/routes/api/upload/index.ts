import path from "path";
import express from "express";
import fsExtra from "fs-extra";
import multer from "multer";
import {
  HEADER_CREATOR_ID,
  HEADER_WORK_ID,
  URL_PREFIX_WORK,
} from "../../../common/constants";
import { WorkDocument, WorkModel } from "../../../models/database";
import * as logger from "../../../modules/logger";
import {
  ensureAuthenticated,
  getUserIdOrThrow,
  updateCreatorIds,
} from "../../../services/auth";
import { csrf } from "../../../services/csrf";
import {
  calculateWorkFileSize,
  uploadSchema,
  calculateCurrentStorageSizeBytes,
  backupWork,
  isCreatorIdUsedByOtherUser,
  getAbsolutePathOfWork,
} from "../../../services/works";
import {
  ERROR_MESSAGE_STORAGE_FULL as STORAGE_FULL,
  ERROR_MESSAGE_NO_FILES as NO_FILES,
  UPLOAD_UNITY_FIELD_WINDOWS,
  UPLOAD_UNITY_FIELD_WEBGL,
  UPLOAD_UNITY_FIELDS,
  ERROR_MESSAGE_CREATOR_ID_USED_BY_OTHER_USER as CREATOR_ID_USED_BY_OTHER_USER,
  ERROR_MESSAGE_MULTIPLE_WORKS_FOUND,
} from "../../../utils/constants";
import { env } from "../../../utils/env";
import { UploadError } from "../../../utils/errors";
import { middlewareToPromise, wrap } from "../../../utils/helpers";

function getCreatorIdFromHeaderOrThrow(req: express.Request) {
  const x = req.headers[HEADER_CREATOR_ID];
  if (typeof x !== "string") {
    throw new Error("リクエストヘッダからの creatorId 取得に失敗しました。");
  }
  return x;
}
function getWorkIdFromHeaderOrThrow(req: express.Request) {
  const x = req.headers[HEADER_WORK_ID];
  if (typeof x !== "string") {
    throw new Error("リクエストヘッダからの workId 取得に失敗しました。");
  }
  return x;
}
async function getFileDestinationOrThrow(
  req: express.Request,
  file: Express.Multer.File
) {
  const { fieldname } = file;
  const parentDir = path.join(
    getAbsolutePathOfWork(
      getCreatorIdFromHeaderOrThrow(req),
      getWorkIdFromHeaderOrThrow(req)
    ),
    fieldname
  );
  if (fieldname === UPLOAD_UNITY_FIELD_WINDOWS) {
    return parentDir;
  }
  if (fieldname === UPLOAD_UNITY_FIELD_WEBGL) {
    const folders = path.dirname(file.originalname).split("/");
    folders.shift();
    return path.join(parentDir, ...folders);
  }
  throw new Error(`fieldname${fieldname}は不正です。`);
}
const unityStorage = multer.diskStorage({
  destination: async (req, file, next) => {
    getFileDestinationOrThrow(req, file)
      .then(async (destination) => {
        await fsExtra.ensureDir(destination);
        next(null, destination);
      })
      .catch((err) => {
        next(err, "");
      });
  },
  filename: (_req, file, callback) => {
    callback(null, path.basename(file.originalname));
  },
});
export const unityUpload = multer({
  storage: unityStorage,
  preservePath: true,
  fileFilter: (_req, file, cb) => {
    const { fieldname, originalname } = file;
    if (fieldname === UPLOAD_UNITY_FIELD_WINDOWS) {
      cb(null, path.extname(originalname) === ".zip");
      return;
    }
    if (fieldname === UPLOAD_UNITY_FIELD_WEBGL) {
      const folders = path.dirname(originalname).split("/");
      //隠しフォルダ内のファイルではないか
      cb(null, !folders.find((f) => f.startsWith(".")));
      return;
    }
    cb(new Error(`fieldname${fieldname}は不正です。`));
  },
});

const uploadRouter = express.Router();
uploadRouter.use(ensureAuthenticated);

if (env.NODE_ENV !== "test") {
  uploadRouter.use(csrf);
}

uploadRouter.post(
  "/unity",
  wrap(async (req, res) => {
    const userId = getUserIdOrThrow(req);
    const { creatorId, workId } = parseParams(req);
    await ensureStorageSpaceAvailable();
    await preventCreatorIdUsedByMultipleUsers({ userId, creatorId });
    const work = await findOrCreateWork({ creatorId, workId, userId });
    await validateDestination({ creatorId, workId, work });
    const uploadStartedAt = new Date();
    await middlewareToPromise(
      unityUpload.fields(UPLOAD_UNITY_FIELDS),
      req,
      res
    );
    const uploadEndedAt = new Date();
    ensureUploadSuccess(req);
    await saveToDatabase({ req, work, creatorId, userId, uploadEndedAt });
    logUploadSuccess({ creatorId, workId, uploadStartedAt, uploadEndedAt });
    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };
    const paths = UPLOAD_UNITY_FIELDS.filter(
      ({ name }) => files[name] !== undefined
    ).map(({ name }) => path.join(URL_PREFIX_WORK, creatorId, workId, name));
    res.json({
      paths,
    });
  })
);

function parseParams(req: express.Request) {
  const creatorId = req.headers[HEADER_CREATOR_ID];
  const workId = req.headers[HEADER_WORK_ID];

  const parsed = uploadSchema.safeParse({
    creatorId: creatorId,
    workId: workId,
  });
  if (parsed.success) {
    return parsed.data;
  } else {
    throw new UploadError(
      parsed.error.errors.map((x) => x.message),
      [creatorId, workId]
    );
  }
}
async function ensureStorageSpaceAvailable() {
  const workStorageSizeBytes = env.WORK_STORAGE_SIZE_BYTES;
  const currentStorageSizeBytes = await calculateCurrentStorageSizeBytes();
  if (workStorageSizeBytes <= currentStorageSizeBytes) {
    throw new UploadError([STORAGE_FULL]);
  }
}
async function preventCreatorIdUsedByMultipleUsers({
  userId,
  creatorId,
}: {
  userId: string;
  creatorId: string;
}) {
  const isUsedByOtherUser = await isCreatorIdUsedByOtherUser(creatorId, userId);
  if (isUsedByOtherUser) {
    throw new UploadError([CREATOR_ID_USED_BY_OTHER_USER]);
  }
}
async function findOrCreateWork({
  creatorId,
  workId,
  userId,
}: {
  creatorId: string;
  workId: string;
  userId: string;
}) {
  const works = await WorkModel.find({
    creatorId,
    workId,
  });
  switch (works.length) {
    case 0:
      return await WorkModel.create({
        creatorId,
        workId,
        owner: userId,
        fileSize: 0,
        backupFileSizes: {},
      });
    case 1:
      return works[0];
    default:
      throw new Error(ERROR_MESSAGE_MULTIPLE_WORKS_FOUND);
  }
}

async function validateDestination({
  creatorId,
  workId,
  work,
}: {
  creatorId: string;
  workId: string;
  work: WorkDocument;
}) {
  const workPath = getAbsolutePathOfWork(creatorId, workId);
  const exists = await fsExtra.pathExists(workPath);
  if (!exists) {
    return;
  }
  await backupWork(creatorId, workId, work);
}
function ensureUploadSuccess(req: express.Request) {
  if (Object.keys(req.files ?? {}).length === 0) {
    throw new UploadError([NO_FILES]);
  }
}

async function saveToDatabase({
  req,
  creatorId,
  userId,
  work,
  uploadEndedAt,
}: {
  req: express.Request;
  creatorId: string;
  userId: string;
  work: WorkDocument;
  uploadEndedAt: Date;
}) {
  const files = req.files as {
    [fieldname: string]: Express.Multer.File[];
  };
  work.fileSize = calculateWorkFileSize(files, UPLOAD_UNITY_FIELDS);
  work.uploadedAt = uploadEndedAt;
  await work.save();

  await updateCreatorIds(userId, creatorId);
}
function logUploadSuccess({
  creatorId,
  workId,
  uploadStartedAt,
  uploadEndedAt,
}: {
  creatorId: string;
  workId: string;
  uploadStartedAt: Date;
  uploadEndedAt: Date;
}) {
  logger.system.info("アップロード成功", {
    creatorId,
    workId,
    uploadStartedAt,
    uploadEndedAt,
    elapsedMillis: uploadEndedAt.getTime() - uploadStartedAt.getTime(),
  });
}
export { uploadRouter };
