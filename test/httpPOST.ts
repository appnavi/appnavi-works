import request from "supertest";
import { app } from "../src/app";
import {
  STATUS_CODE_BAD_REQUEST,
  STATUS_CODE_UNAUTHORIZED,
  ERROR_MESSAGE_CREATOR_ID_REQUIRED as CREATOR_ID_REQUIRED,
  ERROR_MESSAGE_CREATOR_ID_INVALID as CREATOR_ID_INVALID,
  ERROR_MESSAGE_WORK_ID_REQUIRED as WORK_ID_REQUIRED,
  ERROR_MESSAGE_WORK_ID_INVALID as WORK_ID_INVALID,
  ERROR_MESSAGE_DIFFERENT_USER as DIFFERENT_USER,
  ERROR_MESSAGE_STORAGE_FULL as STORAGE_FULL,
  ERROR_MESSAGE_NO_FILES as NO_FILES,
  HEADER_CREATOR_ID,
  HEADER_WORK_ID,
} from "../src/utils/constants";
import { getEnvNumber } from "../src/utils/helpers";
import { login, logout, myId, theirId } from "./auth";
import {
  clearData,
  connectDatabase,
  ensureUploadFoldersExist,
  INVALID_ID,
} from "./common";
import { WorkModel } from "../src/models/database";

const creatorId = "creator-3";
const workId = "work-3";

describe("POST", () => {
  beforeAll(async () => {
    await connectDatabase("3");
    await ensureUploadFoldersExist();
    login(app, myId);
  });
  afterEach(async () => {
    await clearData(creatorId, workId);
  });
  afterAll(() => logout(app));
  describe("Unity作品のアップロード（ファイルなし）", () => {
    it("作品がなければアップロードできない", (done) => {
      request(app)
        .post("/upload/unity")
        .set(HEADER_CREATOR_ID, creatorId)
        .set(HEADER_WORK_ID, workId)
        .expect(STATUS_CODE_BAD_REQUEST)
        .expect(JSON.stringify({ errors: [NO_FILES] }))
        .end(done);
    });
  });
});
