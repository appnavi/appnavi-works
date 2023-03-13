import mongoose from "mongoose";
import { getSecret } from "../src/utils/env";
import {
  absolutePathOfWorkFolder,
  absolutePathOfBackupFolder,
  getAbsolutePathOfWork,
  getAbsolutePathOfAllBackups,
} from "../src/services/works";
import fs from "fs-extra";
import path from "path";

export const INVALID_ID = "テスト";

export async function ensureUploadFoldersEmpty() {
  await fs.rm(absolutePathOfWorkFolder, {
    recursive: true,
    force: true,
  });
  await fs.mkdir(absolutePathOfWorkFolder, { recursive: true });
  await fs.rm(absolutePathOfBackupFolder, {
    recursive: true,
    force: true,
  });
  await fs.mkdir(absolutePathOfBackupFolder, { recursive: true });
}
export async function connectDatabase(databaseId: string) {
  await mongoose.connect(
    `mongodb://${getSecret("MONGO_ROOT_USERNAME")}:${getSecret(
      "MONGO_ROOT_PASSWORD"
    )}@mongo:27017/game-upload-test-${databaseId}?authSource=admin`
  );
}
async function clearFolders(creatorId: string, workId: string) {
  await fs.rm(getAbsolutePathOfWork(creatorId, workId), {
    recursive: true,
    force: true,
  });
  await fs.rm(getAbsolutePathOfAllBackups(creatorId, workId), {
    recursive: true,
    force: true,
  });
}
export async function clearDatabase() {
  const collections = mongoose.connection.collections;
  await Promise.all(
    Object.keys(collections).map((index) => collections[index].deleteMany({}))
  );
}
export async function clearData(creatorId: string, workId: string) {
  await clearFolders(creatorId, workId);
  await clearDatabase();
}

// Callback(done) と async / await を同時に使うとメモリリークが発生するため、その対策
// https://jestjs.io/docs/asynchronous#:~:text=expect(data).-,CAUTION,-Jest%20will%20throw
export function wrap(handler: (done: jest.DoneCallback) => Promise<void>) {
  return (done: jest.DoneCallback) => {
    handler(done).catch(done);
  };
}
