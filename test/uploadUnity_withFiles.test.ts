import express from "express";
import * as multer from "multer";
import { Readable } from "stream";
jest.mock("multer");

// @ts-ignore
multer.mockImplementation(() => {
  return {
    none() {
      return (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        throw new Error("MOCK ERROR");
      };
    },
    fields(fields: string) {
      return (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        const createMockFile = (
          fieldname: string,
          foldername: string,
          subfoldername: string,
          filename: string,
          mimetype: string,
          size: number
        ): Express.Multer.File => {
          const destination = path.join(
            DIRECTORY_UPLOADS_DESTINATION,
            creatorId,
            workId,
            fieldname
          );
          return {
            fieldname,
            originalname: path.join(foldername, subfoldername, filename),
            encoding: "7bit",
            mimetype,
            destination,
            filename,
            path: path.join(destination, subfoldername, filename),
            size,
            buffer: Buffer.from([]),
            stream: Readable.from([]),
          };
        };
        req.files = {
          [FIELD_WEBGL]: [
            createMockFile(
              FIELD_WEBGL,
              "unity-webgl",
              "",
              "index.html",
              "text/html",
              100
            ),
            createMockFile(
              FIELD_WEBGL,
              "unity-webgl",
              "subfolder",
              "script.js",
              "text/javascript",
              200
            ),
          ],
          [FIELD_WINDOWS]: [
            createMockFile(
              FIELD_WINDOWS,
              "",
              "",
              "unity-zip.zip",
              "application/zip",
              300
            ),
          ],
        };
        return next();
      };
    },
  };
});

import request from "supertest";
import { app } from "../src/app";
import { fields, FIELD_WEBGL, FIELD_WINDOWS } from "../src/routes/upload";
import {
  URL_PREFIX_WORK,
  DIRECTORY_UPLOADS_DESTINATION,
  STATUS_CODE_BAD_REQUEST,
  STATUS_CODE_SUCCESS,
  STATUS_CODE_UNAUTHORIZED,
  ERROR_MESSAGE_CREATOR_ID_REQUIRED as CREATOR_ID_REQUIRED,
  ERROR_MESSAGE_CREATOR_ID_INVALID as CREATOR_ID_INVALID,
  ERROR_MESSAGE_WORK_ID_REQUIRED as WORK_ID_REQUIRED,
  ERROR_MESSAGE_WORK_ID_INVALID as WORK_ID_INVALID,
  ERROR_MESSAGE_DIFFERENT_USER as DIFFERENT_USER,
  ERROR_MESSAGE_STORAGE_FULL as STORAGE_FULL,
  HEADER_CREATOR_ID,
  HEADER_WORK_ID,
} from "../src/utils/constants";
import { getEnvNumber } from "../src/utils/helpers";
import { login, logout, myId, theirId } from "./auth";
import { clearData, connectDatabase } from "./common";
import path from "path";
import { WorkModel } from "../src/models/database";

const creatorId = "creator";
const workId = "work";

describe("Unity作品のアップロード（ファイルあり）", () => {
  beforeAll(async () => {
    await connectDatabase();
    await clearData();
  });
  afterEach(async () => {
    await clearData();
  });
  it("非ログイン時にはアップロードができない", (done) => {
    request(app).post("/upload/unity").expect(STATUS_CODE_UNAUTHORIZED, done);
  });
  describe("ログイン時", () => {
    beforeAll(() => login(app, myId));
    afterAll(() => logout(app));

    it("作者IDが設定されていないとアップロードできない", (done) => {
      request(app)
        .post("/upload/unity")
        .set(HEADER_WORK_ID, workId)
        .expect(STATUS_CODE_BAD_REQUEST)
        .expect(CREATOR_ID_REQUIRED)
        .end(done);
    });
    it("作者IDが不適切だとアップロードできない", (done) => {
      request(app)
        .post("/upload/unity")
        .set(HEADER_CREATOR_ID, encodeURI("テスト"))
        .set(HEADER_WORK_ID, workId)
        .expect(STATUS_CODE_BAD_REQUEST)
        .expect(CREATOR_ID_INVALID)
        .end(done);
    });
    it("作品IDが設定されていないとアップロードできない", (done) => {
      request(app)
        .post("/upload/unity")
        .set(HEADER_CREATOR_ID, creatorId)
        .expect(STATUS_CODE_BAD_REQUEST)
        .expect(WORK_ID_REQUIRED)
        .end(done);
    });
    it("作品IDが不適切だとアップロードできない", (done) => {
      request(app)
        .post("/upload/unity")
        .set(HEADER_CREATOR_ID, creatorId)
        .set(HEADER_WORK_ID, encodeURI("テスト"))
        .expect(STATUS_CODE_BAD_REQUEST)
        .expect(WORK_ID_INVALID)
        .end(done);
    });
    it("別人の投稿した作品は上書きアップロードできない", (done) => {
      WorkModel.create({
        creatorId: creatorId,
        workId: workId,
        owner: theirId,
        fileSize: 100,
      }).then(() => {
        request(app)
          .post("/upload/unity")
          .set(HEADER_CREATOR_ID, creatorId)
          .set(HEADER_WORK_ID, workId)
          .expect(STATUS_CODE_BAD_REQUEST)
          .expect(DIFFERENT_USER)
          .end(done);
      });
    });
    it("ストレージ容量の上限を上回っている場合はアップロードできない", (done) => {
      WorkModel.create({
        creatorId: "large-work-creator",
        workId: "large-work",
        owner: theirId,
        fileSize: getEnvNumber("WORK_STORAGE_SIZE_BYTES"),
      }).then(() => {
        request(app)
          .post("/upload/unity")
          .set(HEADER_CREATOR_ID, creatorId)
          .set(HEADER_WORK_ID, workId)
          .expect(STATUS_CODE_BAD_REQUEST)
          .expect(STORAGE_FULL)
          .end(done);
      });
    });
    it("条件を満たしていればアップロードできる", (done) => {
      request(app)
        .post("/upload/unity")
        .set(HEADER_CREATOR_ID, creatorId)
        .set(HEADER_WORK_ID, workId)
        .expect(STATUS_CODE_SUCCESS)
        .expect(
          JSON.stringify({
            paths: fields.map((field) =>
              path.join(URL_PREFIX_WORK, creatorId, workId, field.name)
            ),
          })
        )
        .end(done);
    });
  });
});
