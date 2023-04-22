import request from "supertest";
import { app } from "../src/app";
import { preparePassport } from "../src/config/passport";
import {
  STATUS_CODE_BAD_REQUEST,
  ERROR_MESSAGE_NO_FILES,
} from "../src/utils/constants";
import { createLogin, myId } from "./auth";
import {
  clearData,
  connectDatabase,
  ensureUploadFoldersEmpty,
  wrap,
} from "./common";

const creatorId = "creator-3";
const workId = "work-3";

describe("POST", () => {
  beforeAll(async () => {
    await preparePassport();
    await connectDatabase("httpPOST");
    await ensureUploadFoldersEmpty();
  });
  afterEach(async () => {
    await clearData(creatorId, workId);
  });
  describe("uploadRouter", () => {
    describe("Unity作品のアップロード", () => {
      it(
        "作品がなければアップロードできない",
        wrap(async (done) => {
          const { login } = await createLogin(myId);
          login(request(app).post("/api/upload/unity"))
            .field("creatorId", creatorId)
            .field("workId", workId)
            .expect(STATUS_CODE_BAD_REQUEST)
            .expect(JSON.stringify({ errors: [ERROR_MESSAGE_NO_FILES] }))
            .end(done);
        })
      );
    });
  });
});
