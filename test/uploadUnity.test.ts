import express from "express";
import mongoose from "mongoose";
import request from "supertest";
import { app } from "../src/app";
import { FIELD_WINDOWS } from "../src/routes/upload";
import {
  URL_PREFIX_WORK,
  DIRECTORY_UPLOADS_DESTINATION,
  STATUS_CODE_BAD_REQUEST,
  STATUS_CODE_SUCCESS,
  STATUS_CODE_UNAUTHORIZED,
  MESSAGE_UNITY_UPLOAD_CREATOR_ID_REQUIRED as CREATOR_ID_REQUIRED,
  MESSAGE_UNITY_UPLOAD_CREATOR_ID_INVALID as CREATOR_ID_INVALID,
  MESSAGE_UNITY_UPLOAD_WORK_ID_REQUIRED as WORK_ID_REQUIRED,
  MESSAGE_UNITY_UPLOAD_WORK_ID_INVALID as WORK_ID_INVALID,
  MESSAGE_UNITY_UPLOAD_ALREADY_EXISTS as ALREADY_EXISTS,
  MESSAGE_UNITY_UPLOAD_DIFFERENT_USER as DIFFERENT_USER,
  MESSAGE_UNITY_UPLOAD_STORAGE_FULL as STORAGE_FULL,
  MESSAGE_UNITY_UPLOAD_NO_FILES as NO_FILES,
  HEADER_CREATOR_ID,
  HEADER_WORK_ID,
} from "../src/utils/constants";
import { getEnv, getEnvNumber } from "../src/utils/helpers";
import { login, logout, myId, theirId } from "./auth";
import { clearData, connectDatabase } from "./common";
import fs from "fs-extra";
import path from "path";
import { WorkModel } from "../src/models/database";

const creatorId = "creator";
const workId = "work";
const unityWorkWindowsName = "unity-correct-zip.zip";
const unityWorkWindowsPath = path.join(__dirname, unityWorkWindowsName);

describe("Unity作品のアップロード", () => {
  before(async () => {
    await connectDatabase();
  });
  beforeEach(async () => {
    await clearData();
  });
  it("非ログイン時にはアップロードができない", (done) => {
    request(app).post("/upload/unity").expect(STATUS_CODE_UNAUTHORIZED, done);
  });
  describe("ログイン時", () => {
    before(() => login(app, myId));
    after(() => logout(app));

    it("作者IDが設定されていないとアップロードできない", (done) => {
      request(app)
        .post("/upload/unity")
        .set(HEADER_WORK_ID, workId)
        .attach(FIELD_WINDOWS, unityWorkWindowsPath)
        .expect(STATUS_CODE_BAD_REQUEST)
        .expect(CREATOR_ID_REQUIRED)
        .end(done);
    });
    it("作者IDが不適切だとアップロードできない", (done) => {
      request(app)
        .post("/upload/unity")
        .set(HEADER_CREATOR_ID, encodeURI("テスト"))
        .set(HEADER_WORK_ID, workId)
        .attach(FIELD_WINDOWS, unityWorkWindowsPath)
        .expect(STATUS_CODE_BAD_REQUEST)
        .expect(CREATOR_ID_INVALID)
        .end(done);
    });
    it("作品IDが設定されていないとアップロードできない", (done) => {
      request(app)
        .post("/upload/unity")
        .set(HEADER_CREATOR_ID, creatorId)
        .attach(FIELD_WINDOWS, unityWorkWindowsPath)
        .expect(STATUS_CODE_BAD_REQUEST)
        .expect(WORK_ID_REQUIRED)
        .end(done);
    });
    it("作品IDが不適切だとアップロードできない", (done) => {
      request(app)
        .post("/upload/unity")
        .set(HEADER_CREATOR_ID, creatorId)
        .set(HEADER_WORK_ID, encodeURI("テスト"))
        .attach(FIELD_WINDOWS, unityWorkWindowsPath)
        .expect(STATUS_CODE_BAD_REQUEST)
        .expect(WORK_ID_INVALID)
        .end(done);
    });
    it("別人の投稿した作品は上書きアップロードできない", (done) => {
      WorkModel.create({
        creatorId: creatorId,
        workId: workId,
        createdBy: theirId,
        totalFileSize: 100,
      })
        .then(() =>
          fs.copy(
            unityWorkWindowsPath,
            path.resolve(
              DIRECTORY_UPLOADS_DESTINATION,
              creatorId,
              workId,
              unityWorkWindowsName
            )
          )
        )
        .then(() => {
          request(app)
            .post("/upload/unity")
            .set(HEADER_CREATOR_ID, creatorId)
            .set(HEADER_WORK_ID, workId)
            .attach(FIELD_WINDOWS, unityWorkWindowsPath)
            .expect(STATUS_CODE_BAD_REQUEST)
            .expect(DIFFERENT_USER)
            .end(done);
        });
    });
    it("ストレージ容量の上限を上回っている場合はアップロードできない", (done) => {
      WorkModel.create({
        creatorId: "large-work-creator",
        workId: "large-work",
        createdBy: theirId,
        totalFileSize: getEnvNumber("WORK_STORAGE_SIZE_BYTES"),
      }).then(() => {
        request(app)
          .post("/upload/unity")
          .set(HEADER_CREATOR_ID, creatorId)
          .set(HEADER_WORK_ID, workId)
          .attach(FIELD_WINDOWS, unityWorkWindowsPath)
          .expect(STATUS_CODE_BAD_REQUEST)
          .expect(STORAGE_FULL)
          .end(done);
      });
    });
    it("作品がなければアップロードできない", (done) => {
      request(app)
        .post("/upload/unity")
        .set(HEADER_CREATOR_ID, creatorId)
        .set(HEADER_WORK_ID, workId)
        .expect(STATUS_CODE_BAD_REQUEST)
        .expect(NO_FILES)
        .end(done);
    });
    it("条件を満たしていればアップロードできる", (done) => {
      request(app)
        .post("/upload/unity")
        .set(HEADER_CREATOR_ID, creatorId)
        .set(HEADER_WORK_ID, workId)
        .attach(FIELD_WINDOWS, unityWorkWindowsPath)
        .expect(STATUS_CODE_SUCCESS)
        .expect(
          `{"paths":["${path.join(
            URL_PREFIX_WORK,
            creatorId,
            workId,
            FIELD_WINDOWS
          )}"]}`
        )
        .end(done);
    });
  });
});
