import mongoose from "mongoose";
import request from "supertest";
import { app } from "../src/app";
import { DIRECTORY_UPLOADS_DESTINATION } from "../src/utils/constants";
import { getEnv, getEnvNumber } from "../src/utils/helpers";
import { login, logout, myId } from "./auth";
import fs from "fs-extra";
import path from "path";

async function prepareUploadDestination() {
  const uploadDirPath = path.join(
    __dirname,
    "../",
    DIRECTORY_UPLOADS_DESTINATION
  );
  await fs.emptyDir(uploadDirPath);
}
async function prepareDatabase() {
  await mongoose.connect(getEnv("DATABASE_URL"), {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const db = mongoose.connection;
  await db.dropDatabase();
}

export async function prepare() {
  prepareUploadDestination();
  prepareDatabase();
}
