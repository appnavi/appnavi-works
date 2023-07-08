import path from "path";
import fsExtra from "fs-extra";
import { z } from "zod";
import { PROJECT_ROOT, URL_PREFIX_WORK, idRegex } from "../../common/constants";
import { UserModel, WorkDocument, WorkModel } from "../../models/database";
import {
  ERROR_MESSAGE_CREATOR_ID_REQUIRED,
  ERROR_MESSAGE_CREATOR_ID_INVALID,
  ERROR_MESSAGE_WORK_ID_REQUIRED,
  ERROR_MESSAGE_WORK_ID_INVALID,
  ERROR_MESSAGE_WORK_NOT_FOUND,
  ERROR_MESSAGE_WORK_DIFFERENT_OWNER,
  ERROR_MESSAGE_MULTIPLE_WORKS_FOUND,
} from "../../utils/constants";

const DIRECTORY_NAME_UPLOADS = "uploads";
const DIRECTORY_NAME_BACKUPS = "backups";

export const absolutePathOfWorkFolder = path.join(
  PROJECT_ROOT,
  DIRECTORY_NAME_UPLOADS,
);
export function getAbsolutePathOfWork(creatorId: string, workId: string) {
  return path.join(absolutePathOfWorkFolder, creatorId, workId);
}

export const absolutePathOfBackupFolder = path.join(
  PROJECT_ROOT,
  DIRECTORY_NAME_BACKUPS,
  DIRECTORY_NAME_UPLOADS,
);
export function getAbsolutePathOfAllBackups(creatorId: string, workId: string) {
  return path.join(absolutePathOfBackupFolder, creatorId, workId);
}
export function getAbsolutePathOfBackup(
  creatorId: string,
  workId: string,
  backupName: string,
) {
  return path.join(getAbsolutePathOfAllBackups(creatorId, workId), backupName);
}

export const creatorIdSchema = z
  .string({ required_error: ERROR_MESSAGE_CREATOR_ID_REQUIRED })
  .regex(idRegex, ERROR_MESSAGE_CREATOR_ID_INVALID);
export const workIdSchema = z
  .string({ required_error: ERROR_MESSAGE_WORK_ID_REQUIRED })
  .regex(idRegex, ERROR_MESSAGE_WORK_ID_INVALID);
export const uploadSchema = z.object({
  creatorId: creatorIdSchema,
  workId: workIdSchema,
});
export async function findOwnWorkOrError(
  creatorId: string,
  workId: string,
  userId: string,
) {
  const works = await WorkModel.find({
    creatorId,
    workId,
  });
  switch (works.length) {
    case 0:
      return {
        work: null,
        error: ERROR_MESSAGE_WORK_NOT_FOUND,
      };
    case 1: {
      const work = works[0];
      if (work.owner !== userId) {
        return {
          work: null,
          error: ERROR_MESSAGE_WORK_DIFFERENT_OWNER,
        };
      }
      return { work, error: null };
    }
    default:
      throw new Error(ERROR_MESSAGE_MULTIPLE_WORKS_FOUND);
  }
}

export async function isCreatorIdUsedByOtherUser(
  creatorId: string,
  userId: string,
) {
  const users = await UserModel.find();
  for (const user of users) {
    if (user.userId === userId) continue;
    if (user.creatorIds.includes(creatorId)) return true;
  }
  return false;
}

export async function listBackupFolderNames(creatorId: string, workId: string) {
  const backupFolderPath = getAbsolutePathOfAllBackups(creatorId, workId);
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

export async function getLatestBackupIndex(creatorId: string, workId: string) {
  const backupFolderNames = await listBackupFolderNames(creatorId, workId);
  if (backupFolderNames.length == 0) {
    return 0;
  }
  backupFolderNames.sort();
  const latestBackupFolderName =
    backupFolderNames[backupFolderNames.length - 1];
  return parseInt(latestBackupFolderName);
}

export async function backupWork(
  creatorId: string,
  workId: string,
  work: WorkDocument,
) {
  const workDir = getAbsolutePathOfWork(creatorId, workId);
  const workPath = path.resolve(workDir);
  const latestBackupIndex = await getLatestBackupIndex(creatorId, workId);
  const backupIndex = (latestBackupIndex + 1).toString();
  const backupToPath = getAbsolutePathOfBackup(creatorId, workId, backupIndex);
  await fsExtra.move(workPath, backupToPath);
  work.backups.push({
    name: backupIndex,
    fileSize: work.fileSize,
    uploadedAt: work.uploadedAt,
    paths: work.paths,
  });
}

export async function calculateCurrentStorageSizeBytes() {
  const works = await WorkModel.find();
  return works.reduce((accumulator, currentValue) => {
    const totalBackupFileSizes = currentValue.backups.reduce(
      (a, c) => a + c.fileSize,
      0,
    );
    return accumulator + currentValue.fileSize + totalBackupFileSizes;
  }, 0);
}

export function calculateWorkFileSize(
  files: {
    [fieldname: string]: Express.Multer.File[];
  },
  fields: { name: string }[],
) {
  let fileSize = 0;
  fields.forEach(({ name }) =>
    (files[name] ?? []).forEach((file) => {
      fileSize += file.size;
    }),
  );
  return fileSize;
}

export function renameWorkPaths(
  paths: string[],
  creatorId: string,
  workId: string,
  renamedCreatorId: string,
  renamedWorkId: string,
) {
  return paths.map((x) =>
    x.replace(
      `${URL_PREFIX_WORK}/${creatorId}/${workId}`,
      `${URL_PREFIX_WORK}/${renamedCreatorId}/${renamedWorkId}`,
    ),
  );
}
