import path from "path";
import express from "express";
import fsExtra from "fs-extra";
import multer from "multer";
import { PROJECT_ROOT, URL_PREFIX_WORK } from "../../../common/constants";
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
import { wrap } from "../../../utils/helpers";

const unityStorage = multer.diskStorage({
  destination: path.join(PROJECT_ROOT, "temp"),
});

export const unityUpload = multer({
  storage: unityStorage,
  preservePath: true,
});

const uploadRouter = express.Router();
uploadRouter.use(ensureAuthenticated);

if (env.NODE_ENV !== "test") {
  uploadRouter.use(csrf);
}

uploadRouter.post(
  "/unity",
  unityUpload.fields(UPLOAD_UNITY_FIELDS),
  wrap(async (req, res) => {
    try {
      await processUploadedWorks({ req, res });
    } finally {
      await cleanupTemps({ req });
    }
  }),
);
async function processUploadedWorks({
  req,
  res,
}: {
  req: express.Request;
  res: express.Response;
}) {
  const userId = getUserIdOrThrow(req);
  const { creatorId, workId } = parseParams(req);
  await ensureStorageSpaceAvailable();
  await preventCreatorIdUsedByMultipleUsers({ userId, creatorId });
  const work = await findWorkOrUndefined({ creatorId, workId });
  await validateDestination({ creatorId, workId, work });
  const uploadStartedAt = new Date();
  await copyUploadedFilesToDestination({ req, creatorId, workId });
  const uploadEndedAt = new Date();
  ensureUploadSuccess(req);
  const paths = uploadedFilesToPaths({ req, creatorId, workId });
  await saveToDatabase({
    req,
    work,
    creatorId,
    workId,
    userId,
    uploadEndedAt,
    paths,
  });
  logUploadSuccess({ creatorId, workId, uploadStartedAt, uploadEndedAt });
  res.json({
    paths,
  });
}

function parseParams(req: express.Request) {
  const parsed = uploadSchema.safeParse(req.body);
  if (parsed.success) {
    return parsed.data;
  } else {
    throw new UploadError(
      parsed.error.errors.map((x) => x.message),
      req.body,
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
async function findWorkOrUndefined({
  creatorId,
  workId,
}: {
  creatorId: string;
  workId: string;
}) {
  const works = await WorkModel.find({
    creatorId,
    workId,
  });
  switch (works.length) {
    case 0:
      return undefined;
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
  work: WorkDocument | undefined;
}) {
  const workPath = getAbsolutePathOfWork(creatorId, workId);
  const exists = await fsExtra.pathExists(workPath);
  if (!exists || work === undefined) {
    return;
  }
  await backupWork(creatorId, workId, work);
}
async function copyWindowsFiles({
  creatorId,
  workId,
  files,
}: {
  creatorId: string;
  workId: string;
  files: Express.Multer.File[] | undefined;
}) {
  if (files === undefined) {
    return;
  }
  if (files.length != 1) {
    throw new UploadError(
      ["複数個のWindowsファイルはアップロードできません。"],
      files,
    );
  }
  const file = files[0];
  if (path.extname(file.originalname).toLowerCase() !== ".zip") {
    throw new UploadError(["ZIPファイル以外はアップロードできません。"], files);
  }
  const destination = path.join(
    getAbsolutePathOfWork(creatorId, workId),
    UPLOAD_UNITY_FIELD_WINDOWS,
    path.basename(file.originalname),
  );
  await fsExtra.ensureDir(path.dirname(destination));
  await fsExtra.copyFile(file.path, destination);
}
function copyWebGLFiles({
  creatorId,
  workId,
  files,
}: {
  creatorId: string;
  workId: string;
  files: Express.Multer.File[] | undefined;
}) {
  if (files === undefined) {
    return;
  }
  return Promise.all(
    files.map(async (file) => {
      const { originalname } = file;
      const folders = path.dirname(originalname).split("/");
      folders.shift();
      if (folders.find((f) => f.startsWith(".")) !== undefined) {
        return;
      }
      const destination = path.join(
        getAbsolutePathOfWork(creatorId, workId),
        UPLOAD_UNITY_FIELD_WEBGL,
        ...folders,
        path.basename(originalname),
      );
      await fsExtra.ensureDir(path.dirname(destination));
      await fsExtra.copyFile(file.path, destination);
    }),
  );
}
async function copyUploadedFilesToDestination({
  req,
  creatorId,
  workId,
}: {
  req: express.Request;
  creatorId: string;
  workId: string;
}) {
  const { files } = req;
  if (files == undefined || Array.isArray(files)) {
    return;
  }
  await Promise.all([
    copyWindowsFiles({
      creatorId,
      workId,
      files: files[UPLOAD_UNITY_FIELD_WINDOWS],
    }),
    copyWebGLFiles({
      creatorId,
      workId,
      files: files[UPLOAD_UNITY_FIELD_WEBGL],
    }),
  ]);
}
function ensureUploadSuccess(req: express.Request) {
  if (Object.keys(req.files ?? {}).length === 0) {
    throw new UploadError([NO_FILES]);
  }
}

function uploadedFilesToPaths({
  req,
  creatorId,
  workId,
}: {
  req: express.Request;
  creatorId: string;
  workId: string;
}) {
  const files = req.files as {
    [fieldname: string]: Express.Multer.File[];
  };
  const paths = <string[]>[];
  for (const { name } of UPLOAD_UNITY_FIELDS) {
    const filesOfField = files[name];
    if (filesOfField === undefined) {
      continue;
    }

    if (name == UPLOAD_UNITY_FIELD_WEBGL) {
      paths.push(path.join(URL_PREFIX_WORK, creatorId, workId, name));
    } else if (name === UPLOAD_UNITY_FIELD_WINDOWS) {
      if (filesOfField.length !== 1) {
        throw new Error("Windowsのアップロード結果が不正です");
      }
      paths.push(
        path.join(
          URL_PREFIX_WORK,
          creatorId,
          workId,
          name,
          path.basename(filesOfField[0].originalname),
        ),
      );
    } else {
      throw new Error(`想定外のフィールド名 ${name} です`);
    }
  }
  return paths;
}

async function saveToDatabase({
  req,
  creatorId,
  workId,
  userId,
  work,
  uploadEndedAt,
  paths,
}: {
  req: express.Request;
  creatorId: string;
  workId: string;
  userId: string;
  work: WorkDocument | undefined;
  uploadEndedAt: Date;
  paths: string[];
}) {
  const files = req.files as {
    [fieldname: string]: Express.Multer.File[];
  };
  const fileSize = calculateWorkFileSize(files, UPLOAD_UNITY_FIELDS);
  const uploadedAt = uploadEndedAt;
  if (work !== undefined) {
    work.fileSize = fileSize;
    work.uploadedAt = uploadedAt;
    work.paths = paths;
    await work.save();
  } else {
    await WorkModel.create({
      creatorId,
      workId,
      owner: userId,
      fileSize,
      uploadedAt,
      paths,
    });
  }

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
async function cleanupTemps({ req }: { req: express.Request }) {
  const { files } = req;
  if (files == undefined || Array.isArray(files)) {
    return;
  }
  await Promise.all(
    UPLOAD_UNITY_FIELDS.map(({ name }) => {
      const filesOfField = files[name];
      if (filesOfField === undefined) {
        return Promise.resolve();
      }
      return filesOfField.map(async (file) => {
        fsExtra.rm(file.path);
      });
    }).flat(),
  );
}

export { uploadRouter };
