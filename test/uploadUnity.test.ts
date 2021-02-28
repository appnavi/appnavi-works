import express from "express";
import mongoose from "mongoose";
import request from "supertest";
import { app } from "../src/app";
import { FIELD_WINDOWS } from "../src/services/upload";
import { DIRECTORY_UPLOADS_DESTINATION } from "../src/utils/constants";
import { getEnv, getEnvNumber } from "../src/utils/helpers";
import { login, logout, myId } from "./auth";
import { prepare, connectDatabase } from "./common";
import fs from "fs-extra";
import path from "path";
import { Multer } from "multer";

const creatorId = "creator";
const gameId = "game";

//TODO：multerを単体テストする方法の模索(候補：sinon)
describe("Unityゲームのアップロード", () => {
  before(async () => {
    await connectDatabase();
    await prepare();
  });
  it("非ログイン時にはアップロードができない", (done) => {
    request(app).post("/upload/unity").expect(401, done);
  });
  describe("ログイン時", () => {
    before(() => login(app, myId));
    after(() => logout(app));
    it("条件を満たしていればアップロードできる", (done) => {
      request(app)
        .post("/upload/unity")
        .set("x-creator-id", creatorId)
        .set("x-game-id", gameId)
        .set("x-overwrites-existing", "false")
        .attach(FIELD_WINDOWS, path.join(__dirname, "unity-correct-zip.zip"))
        .expect(200)
        .end(done);
    });
  });
});
