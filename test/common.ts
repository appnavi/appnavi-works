import mongoose from "mongoose";
import {
  DIRECTORY_NAME_BACKUPS,
  DIRECTORY_NAME_UPLOADS,
} from "../src/utils/constants";
import fs from "fs-extra";
import path from "path";

export async function ensureUploadFoldersExist() {
  await fs.rm(path.resolve(DIRECTORY_NAME_UPLOADS), {
    recursive: true,
    force: true,
  });
  await fs.mkdir(path.resolve(DIRECTORY_NAME_UPLOADS), { recursive: true });
  await fs.rm(path.resolve(DIRECTORY_NAME_BACKUPS), {
    recursive: true,
    force: true,
  });
  await fs.mkdir(path.resolve(DIRECTORY_NAME_BACKUPS), { recursive: true });
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
  await fs.emptyDir(
    path.resolve(
      DIRECTORY_NAME_BACKUPS,
      DIRECTORY_NAME_UPLOADS,
      creatorId,
      workId
    )
  );
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
