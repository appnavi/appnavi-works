import mongoose from "mongoose";
import request from "supertest";
import { app } from "../src/app";
import { FIELD_WEBGL, FIELD_WINDOWS } from "../src/services/upload";
import { DIRECTORY_UPLOADS_DESTINATION } from "../src/utils/constants";
import { getEnv, getEnvNumber } from "../src/utils/helpers";
import { login, logout, myId } from "./auth";
import { prepare } from "./common";
import fs from "fs-extra";
import path from "path";

//TODO：multerを単体テストする方法の模索(候補：sinon)
describe("Unityゲームのアップロード", () => {
  before(prepare);
  describe("ログイン有無", () => {
    it("非ログイン時にはアップロードができない", (done) => {
      request(app).post("/upload/unity").expect(401, done);
    });
  });
});
