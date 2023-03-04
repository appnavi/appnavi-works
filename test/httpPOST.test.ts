import request from "supertest";
import { createApp } from "../src/app";
import { preparePassport } from "../src/config/passport";
import {
  STATUS_CODE_BAD_REQUEST,
  ERROR_MESSAGE_CREATOR_ID_REQUIRED as CREATOR_ID_REQUIRED,
  ERROR_MESSAGE_CREATOR_ID_INVALID as CREATOR_ID_INVALID,
  ERROR_MESSAGE_NO_FILES as NO_FILES,
  HEADER_CREATOR_ID,
  HEADER_WORK_ID,
  STATUS_CODE_SUCCESS,
  STATUS_CODE_UNAUTHORIZED,
} from "../src/utils/constants";
import { login, logout, myId } from "./auth";
import {
  clearData,
  connectDatabase,
  ensureUploadFoldersExist,
  INVALID_ID,
} from "./common";
import { UserModel } from "../src/models/database";
import { Express } from "express";

const creatorId = "creator-3";
const workId = "work-3";

describe("POST", () => {
  let app: Express;
  beforeAll(async () => {
    app = await createApp(await preparePassport());
    await connectDatabase("3");
    await ensureUploadFoldersExist();
    login(app, myId);
  });
  afterEach(async () => {
    await clearData(creatorId, workId);
  });
  afterAll(logout);
  describe("uploadRouter", () => {
    describe("Unity作品のアップロード", () => {
      it("作品がなければアップロードできない", (done) => {
        request(app)
          .post("/api/upload/unity")
          .set(HEADER_CREATOR_ID, creatorId)
          .set(HEADER_WORK_ID, workId)
          .expect(STATUS_CODE_BAD_REQUEST)
          .expect(JSON.stringify({ errors: [NO_FILES] }))
          .end(done);
      });
    });
  });
  describe("accountRouter", () => {
    describe("デフォルトの作者ID", () => {
      it("ログインしていなければデフォルトの作者IDを設定できない", (done) => {
        logout();
        request(app)
          .post("/api/account/default-creator-id")
          .type("form")
          .field("default_creator_id", creatorId)
          .expect(STATUS_CODE_UNAUTHORIZED)
          .end((err) => {
            login(app, myId);
            if (err) throw err;
            done();
          });
      });
      it("作者IDが設定されていないとデフォルトの作者IDを設定できない", (done) => {
        request(app)
          .post("/api/account/default-creator-id")
          .type("form")
          .expect(STATUS_CODE_BAD_REQUEST)
          .expect(JSON.stringify({ errors: [CREATOR_ID_REQUIRED] }))
          .end(done);
      });
      it("作者IDが不適切だとデフォルトの作者IDを設定できない", (done) => {
        request(app)
          .post("/api/account/default-creator-id")
          .type("form")
          .field("default_creator_id", INVALID_ID)
          .expect(STATUS_CODE_BAD_REQUEST)
          .expect(JSON.stringify({ errors: [CREATOR_ID_INVALID] }))
          .end(done);
      });
      it("条件を満たしていればデフォルトの作者IDを設定できる", (done) => {
        request(app)
          .post("/api/account/default-creator-id")
          .type("form")
          .field("default_creator_id", creatorId)
          .expect(STATUS_CODE_SUCCESS)
          .end((err) => {
            expect(err).toBeNull();
            UserModel.find().then((users) => {
              expect(users.length).toBe(1);
              expect(users[0].defaultCreatorId).toBe(creatorId);
              done();
            });
          });
      });
    });
  });
});
