import path from "path";
import fsExtra from "fs-extra";
import * as yup from "yup";
import { WorkDocument, WorkModel } from "../models/database";
import {
  DIRECTORY_NAME_UPLOADS,
  ERROR_MESSAGE_CREATOR_ID_REQUIRED,
  ERROR_MESSAGE_CREATOR_ID_INVALID,
  ERROR_MESSAGE_WORK_ID_REQUIRED,
  ERROR_MESSAGE_WORK_ID_INVALID,
  DIRECTORY_NAME_BACKUPS,
  ERROR_MESSAGE_WORK_NOT_FOUND,
  ERROR_MESSAGE_WORK_DIFFERENT_OWNER,
  ERROR_MESSAGE_MULTIPLE_WORKS_FOUND,
  ERROR_MESSAGE_RENAME_TO_SAME,
  ERROR_MESSAGE_RENAME_TO_EXISTING,
} from "../utils/constants";
import { BadRequestError } from "../utils/errors";

const idRegex = /^[0-9a-z-]+$/;
export const creatorIdSchema = yup
  .string()
  .matches(idRegex, ERROR_MESSAGE_CREATOR_ID_INVALID)
  .required(ERROR_MESSAGE_CREATOR_ID_REQUIRED);
export const workIdSchema = yup
  .string()
  .matches(idRegex, ERROR_MESSAGE_WORK_ID_INVALID)
  .required(ERROR_MESSAGE_WORK_ID_REQUIRED);
export const uploadSchema = yup.object({
  creatorId: creatorIdSchema,
  workId: workIdSchema,
});
async function findWorkOrThrow(
  creatorId: string,
  workId: string,
  userId: string
): Promise<WorkDocument> {
  const works = await WorkModel.find({
    creatorId,
    workId,
  });
  switch (works.length) {
    case 0:
      throw new BadRequestError(ERROR_MESSAGE_WORK_NOT_FOUND);
    case 1: {
      const work = works[0];
      if (work.owner !== userId) {
        throw new BadRequestError(ERROR_MESSAGE_WORK_DIFFERENT_OWNER);
      }
      return work;
    }
    default:
      throw new Error(ERROR_MESSAGE_MULTIPLE_WORKS_FOUND);
  }
}

export async function findOrCreateWork(
  creatorId: string,
  workId: string,
  userId: string
): Promise<WorkDocument> {
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

export async function listBackupFolderNames(
  creatorId: string,
  workId: string
): Promise<string[]> {
  const workDir = path.join(DIRECTORY_NAME_UPLOADS, creatorId, workId);
  const backupFolderPath = path.resolve(DIRECTORY_NAME_BACKUPS, workDir);
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
  creatorId: string,
  workId: string
): Promise<number> {
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
  work: WorkDocument
): Promise<void> {
  const workDir = path.join(DIRECTORY_NAME_UPLOADS, creatorId, workId);
  const workPath = path.resolve(workDir);
  const backupFolderPath = path.resolve(DIRECTORY_NAME_BACKUPS, workDir);
  const latestBackupIndex = await getLatestBackupIndex(creatorId, workId);
  const backupIndex = (latestBackupIndex + 1).toString();
  const backupToPath = path.join(backupFolderPath, backupIndex);
  await fsExtra.move(workPath, backupToPath);
  work.backups.push({
    name: backupIndex,
    fileSize: work.fileSize,
    uploadedAt: work.uploadedAt,
  });
}

export async function restoreBackup(
  creatorId: string,
  workId: string,
  userId: string,
  backupName: string
): Promise<void> {
  const work = await findWorkOrThrow(creatorId, workId, userId);
  await backupWork(creatorId, workId, work);
  const workDir = path.join(DIRECTORY_NAME_UPLOADS, creatorId, workId);
  const workPath = path.resolve(workDir);
  const backupToRestorePath = path.resolve(
    DIRECTORY_NAME_BACKUPS,
    workDir,
    backupName
  );
  const backupToRestore = work.backups.find((it) => it.name === backupName);
  if (
    backupToRestore === undefined ||
    !(await fsExtra.pathExists(backupToRestorePath))
  ) {
    throw new Error(`バックアップ${backupName}が見つかりませんでした。`);
  }
  await fsExtra.move(backupToRestorePath, workPath);
  work.fileSize = backupToRestore.fileSize;
  work.backups.remove(backupToRestore);
  await work.save();
}
export async function deleteBackup(
  creatorId: string,
  workId: string,
  userId: string,
  backupName: string
): Promise<void> {
  const work = await findWorkOrThrow(creatorId, workId, userId);
  const backupToDeletePath = path.resolve(
    DIRECTORY_NAME_BACKUPS,
    DIRECTORY_NAME_UPLOADS,
    creatorId,
    workId,
    backupName
  );
  const backupToDelete = work.backups.find((it) => it.name === backupName);
  if (
    backupToDelete === undefined ||
    !(await fsExtra.pathExists(backupToDeletePath))
  ) {
    throw new Error(`バックアップ${backupName}が見つかりませんでした。`);
  }
  await fsExtra.remove(backupToDeletePath);
  work.backups.remove(backupToDelete);
  await work.save();
}
export async function renameWork(
  creatorId: string,
  workId: string,
  userId: string,
  renamedCreatorId: string,
  renamedWorkId: string
): Promise<void> {
  if (creatorId === renamedCreatorId && workId === renamedWorkId) {
    throw new BadRequestError(ERROR_MESSAGE_RENAME_TO_SAME);
  }
  const work = await findWorkOrThrow(creatorId, workId, userId);
  const workDir = path.join(DIRECTORY_NAME_UPLOADS, creatorId, workId);
  const backupPath = path.resolve(DIRECTORY_NAME_BACKUPS, workDir);
  const renamedWorks = await WorkModel.find({
    creatorId: renamedCreatorId,
    workId: renamedWorkId,
  });
  if (renamedWorks.length > 0) {
    throw new BadRequestError(ERROR_MESSAGE_RENAME_TO_EXISTING);
  }
  const renamedDir = path.join(
    DIRECTORY_NAME_UPLOADS,
    renamedCreatorId,
    renamedWorkId
  );
  const renamedPath = path.resolve(renamedDir);
  await fsExtra.ensureDir(path.resolve(renamedPath, ".."));
  await fsExtra.move(path.resolve(workDir), renamedPath);
  if (await fsExtra.pathExists(backupPath)) {
    const renamedBackupPath = path.resolve(DIRECTORY_NAME_BACKUPS, renamedDir);
    await fsExtra.ensureDir(path.resolve(renamedBackupPath, ".."));
    await fsExtra.move(backupPath, renamedBackupPath);
  }
  work.creatorId = renamedCreatorId;
  work.workId = renamedWorkId;
  await work.save();
}

export async function calculateCurrentStorageSizeBytes(): Promise<number> {
  const works = await WorkModel.find();
  return works.reduce((accumulator, currentValue) => {
    const totalBackupFileSizes = currentValue.backups.reduce(
      (a, c) => a + c.fileSize,
      0
    );
    return accumulator + currentValue.fileSize + totalBackupFileSizes;
  }, 0);
}

export function calculateWorkFileSize(
  files: {
    [fieldname: string]: Express.Multer.File[];
  },
  fields: { name: string }[]
): number {
  let fileSize = 0;
  fields.forEach(({ name }) =>
    (files[name] ?? []).forEach((file) => {
      fileSize += file.size;
    })
  );
  return fileSize;
}
