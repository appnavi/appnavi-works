import path from "path";
import fsExtra from "fs-extra";
import * as yup from "yup";
import { WorkDocument, WorkModel } from "../models/database";
import {
  DIRECTORY_UPLOADS_DESTINATION,
  MESSAGE_UNITY_UPLOAD_CREATOR_ID_REQUIRED as CREATOR_ID_REQUIRED,
  MESSAGE_UNITY_UPLOAD_CREATOR_ID_INVALID as CREATOR_ID_INVALID,
  MESSAGE_UNITY_UPLOAD_WORK_ID_REQUIRED as WORK_ID_REQUIRED,
  MESSAGE_UNITY_UPLOAD_WORK_ID_INVALID as WORK_ID_INVALID,
  DIRECTORY_NAME_BACKUPS,
} from "../utils/constants";

const idRegex = /^[0-9a-z-]+$/;
export const creatorIdSchema = yup
  .string()
  .matches(idRegex, CREATOR_ID_INVALID)
  .required(CREATOR_ID_REQUIRED);
export const workIdSchema = yup
  .string()
  .matches(idRegex, WORK_ID_INVALID)
  .required(WORK_ID_REQUIRED);
export const uploadSchema = yup.object({
  creatorId: creatorIdSchema,
  workId: workIdSchema,
});

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
      throw new Error("同じ作品が複数登録されています");
  }
}

export async function listBackupFolderNames(
  creatorId: string,
  workId: string
): Promise<string[]> {
  const workDir = path.join(DIRECTORY_UPLOADS_DESTINATION, creatorId, workId);
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
  const workDir = path.join(DIRECTORY_UPLOADS_DESTINATION, creatorId, workId);
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
  work: WorkDocument,
  backupName: string
): Promise<void> {
  await backupWork(creatorId, workId, work);
  const workDir = path.join(DIRECTORY_UPLOADS_DESTINATION, creatorId, workId);
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
  work: WorkDocument,
  backupName: string
): Promise<void> {
  const workDir = path.join(DIRECTORY_UPLOADS_DESTINATION, creatorId, workId);
  const backupToDeletePath = path.resolve(
    DIRECTORY_NAME_BACKUPS,
    workDir,
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
