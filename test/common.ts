import mongoose from "mongoose";
import {
  DIRECTORY_NAME_BACKUPS,
  DIRECTORY_NAME_UPLOADS,
} from "../src/utils/constants";
import fs from "fs-extra";
import path from "path";

export async function ensureUploadFoldersExist() {
  await fs.emptyDir(path.resolve(DIRECTORY_NAME_UPLOADS));
  await fs.emptyDir(path.resolve(DIRECTORY_NAME_BACKUPS));
}

export async function connectDatabase(databaseId: string) {
  await mongoose.connect(
    `mongodb://mongo:27017/game-upload-test-${databaseId}`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  );
}
async function clearFolders(creatorId: string, workId: string) {
  await fs.emptyDir(path.resolve(DIRECTORY_NAME_UPLOADS, creatorId, workId));
  await fs.emptyDir(path.resolve(DIRECTORY_NAME_BACKUPS, creatorId, workId));
}
async function clearDatabase() {
  const collections = mongoose.connection.collections;
  await Promise.all(
    Object.keys(collections).map((index) => collections[index].deleteMany({}))
  );
}
export async function clearData(creatorId: string, workId: string) {
  await clearFolders(creatorId, workId);
  await clearDatabase();
}
