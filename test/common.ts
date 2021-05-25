import mongoose from "mongoose";
import {
  DIRECTORY_NAME_BACKUPS,
  DIRECTORY_NAME_UPLOADS,
} from "../src/utils/constants";
import { getEnv } from "../src/utils/helpers";
import fs from "fs-extra";
import path from "path";

async function clearFolders() {
  await fs.emptyDir(path.resolve(DIRECTORY_NAME_UPLOADS));
  await fs.emptyDir(path.resolve(DIRECTORY_NAME_BACKUPS));
}
async function clearDatabase() {
  const db = mongoose.connection;
  await db.dropDatabase();
}
export async function connectDatabase() {
  await mongoose.connect(getEnv("DATABASE_URL"), {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}

export async function clearData() {
  await clearFolders();
  await clearDatabase();
}
