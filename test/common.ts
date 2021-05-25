import mongoose from "mongoose";
import { DIRECTORY_NAME_UPLOADS } from "../src/utils/constants";
import { getEnv } from "../src/utils/helpers";
import fs from "fs-extra";
import path from "path";

async function clearUploadDestination() {
  const uploadDirPath = path.resolve(DIRECTORY_NAME_UPLOADS);
  await fs.emptyDir(uploadDirPath);
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
  await clearUploadDestination();
  await clearDatabase();
}
