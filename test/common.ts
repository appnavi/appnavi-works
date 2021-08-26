import mongoose from "mongoose";
import {
  DIRECTORY_NAME_BACKUPS,
  DIRECTORY_NAME_UPLOADS,
} from "../src/utils/constants";
import { getSecret } from "../src/utils/helpers";
import fs from "fs-extra";
import path from "path";

export const INVALID_ID = "テスト";

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
    `mongodb://${getSecret("MONGO_ROOT_USERNAME")}:${getSecret(
      "MONGO_ROOT_PASSWORD"
    )}@mongo:27017/game-upload-test-${databaseId}?authSource=admin`
  );
}
async function clearFolders(creatorId: string, workId: string) {
  await fs.rm(path.resolve(DIRECTORY_NAME_UPLOADS, creatorId, workId), {
    recursive: true,
    force: true,
  });
  await fs.rm(
    path.resolve(
      DIRECTORY_NAME_BACKUPS,
      DIRECTORY_NAME_UPLOADS,
      creatorId,
      workId
    ),
    { recursive: true, force: true }
  );
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
