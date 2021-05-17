import express from "express";
import mongoose from "mongoose";
import request from "supertest";
import { app } from "../src/app";
import { FIELD_WINDOWS } from "../src/services/games";
import {
  URL_PREFIX_GAME,
  DIRECTORY_UPLOADS_DESTINATION,
  STATUS_CODE_BAD_REQUEST,
  STATUS_CODE_SUCCESS,
  STATUS_CODE_UNAUTHORIZED,
  MESSAGE_UNITY_UPLOAD_CREATOR_ID_REQUIRED as CREATOR_ID_REQUIRED,
  MESSAGE_UNITY_UPLOAD_CREATOR_ID_INVALID as CREATOR_ID_INVALID,
  MESSAGE_UNITY_UPLOAD_GAME_ID_REQUIRED as GAME_ID_REQUIRED,
  MESSAGE_UNITY_UPLOAD_GAME_ID_INVALID as GAME_ID_INVALID,
  MESSAGE_UNITY_UPLOAD_ALREADY_EXISTS as ALREADY_EXISTS,
  MESSAGE_UNITY_UPLOAD_DIFFERENT_USER as DIFFERENT_USER,
  MESSAGE_UNITY_UPLOAD_STORAGE_FULL as STORAGE_FULL,
  MESSAGE_UNITY_UPLOAD_NO_FILES as NO_FILES,
  HEADER_CREATOR_ID,
  HEADER_GAME_ID,
  HEADER_OVERWRITES_EXISTING,
} from "../src/utils/constants";
import { getEnv, getEnvNumber } from "../src/utils/helpers";
import { login, logout, myId, theirId } from "./auth";
import { clearData, connectDatabase } from "./common";
import fs from "fs-extra";
import path from "path";
import { GameModel } from "../src/models/database";

const creatorId = "creator";
const gameId = "game";
const unityGameWindowsName = "unity-correct-zip.zip";
const unityGameWindowsPath = path.join(__dirname, unityGameWindowsName);

describe("Unityゲームのアップロード", () => {
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
        .set(HEADER_GAME_ID, gameId)
        .set(HEADER_OVERWRITES_EXISTING, "false")
        .attach(FIELD_WINDOWS, unityGameWindowsPath)
        .expect(STATUS_CODE_BAD_REQUEST)
        .expect(CREATOR_ID_REQUIRED)
        .end(done);
    });
    it("作者IDが設定されていないとアップロードできない", (done) => {
      request(app)
        .post("/upload/unity")
        .set(HEADER_CREATOR_ID, encodeURI("テスト"))
        .set(HEADER_GAME_ID, gameId)
        .set(HEADER_OVERWRITES_EXISTING, "false")
        .attach(FIELD_WINDOWS, unityGameWindowsPath)
        .expect(STATUS_CODE_BAD_REQUEST)
        .expect(CREATOR_ID_INVALID)
        .end(done);
    });
    it("ゲームIDが設定されていないとアップロードできない", (done) => {
      request(app)
        .post("/upload/unity")
        .set(HEADER_CREATOR_ID, creatorId)
        .set(HEADER_OVERWRITES_EXISTING, "false")
        .attach(FIELD_WINDOWS, unityGameWindowsPath)
        .expect(STATUS_CODE_BAD_REQUEST)
        .expect(GAME_ID_REQUIRED)
        .end(done);
    });
    it("作者IDが設定されていないとアップロードできない", (done) => {
      request(app)
        .post("/upload/unity")
        .set(HEADER_CREATOR_ID, creatorId)
        .set(HEADER_GAME_ID, encodeURI("テスト"))
        .set(HEADER_OVERWRITES_EXISTING, "false")
        .attach(FIELD_WINDOWS, unityGameWindowsPath)
        .expect(STATUS_CODE_BAD_REQUEST)
        .expect(GAME_ID_INVALID)
        .end(done);
    });
    it("既に存在する場合、上書き設定していなければアップロードできない", (done) => {
      GameModel.create({
        creatorId: creatorId,
        gameId: gameId,
        createdBy: myId,
        totalFileSize: 100,
      })
        .then(() =>
          fs.copy(
            unityGameWindowsPath,
            path.join(
              __dirname,
              "../",
              DIRECTORY_UPLOADS_DESTINATION,
              creatorId,
              gameId,
              unityGameWindowsName
            )
          )
        )
        .then(() => {
          request(app)
            .post("/upload/unity")
            .set(HEADER_CREATOR_ID, creatorId)
            .set(HEADER_GAME_ID, gameId)
            .set(HEADER_OVERWRITES_EXISTING, "false")
            .attach(FIELD_WINDOWS, unityGameWindowsPath)
            .expect(STATUS_CODE_BAD_REQUEST)
            .expect(ALREADY_EXISTS)
            .end(done);
        });
    });
    it("別人の投稿したゲームは上書きアップロードできない", (done) => {
      GameModel.create({
        creatorId: creatorId,
        gameId: gameId,
        createdBy: theirId,
        totalFileSize: 100,
      })
        .then(() =>
          fs.copy(
            unityGameWindowsPath,
            path.join(
              __dirname,
              "../",
              DIRECTORY_UPLOADS_DESTINATION,
              creatorId,
              gameId,
              unityGameWindowsName
            )
          )
        )
        .then(() => {
          request(app)
            .post("/upload/unity")
            .set(HEADER_CREATOR_ID, creatorId)
            .set(HEADER_GAME_ID, gameId)
            .set(HEADER_OVERWRITES_EXISTING, "true")
            .attach(FIELD_WINDOWS, unityGameWindowsPath)
            .expect(STATUS_CODE_BAD_REQUEST)
            .expect(DIFFERENT_USER)
            .end(done);
        });
    });
    it("ストレージ容量の上限を上回っている場合はアップロードできない", (done) => {
      GameModel.create({
        creatorId: "large-game-creator",
        gameId: "large-game",
        createdBy: theirId,
        totalFileSize: getEnvNumber("GAME_STORAGE_SIZE_BYTES"),
      }).then(() => {
        request(app)
          .post("/upload/unity")
          .set(HEADER_CREATOR_ID, creatorId)
          .set(HEADER_GAME_ID, gameId)
          .set(HEADER_OVERWRITES_EXISTING, "false")
          .attach(FIELD_WINDOWS, unityGameWindowsPath)
          .expect(STATUS_CODE_BAD_REQUEST)
          .expect(STORAGE_FULL)
          .end(done);
      });
    });
    it("ゲームがなければアップロードできない", (done) => {
      request(app)
        .post("/upload/unity")
        .set(HEADER_CREATOR_ID, creatorId)
        .set(HEADER_GAME_ID, gameId)
        .set(HEADER_OVERWRITES_EXISTING, "false")
        .expect(STATUS_CODE_BAD_REQUEST)
        .expect(NO_FILES)
        .end(done);
    });
    it("条件を満たしていればアップロードできる", (done) => {
      request(app)
        .post("/upload/unity")
        .set(HEADER_CREATOR_ID, creatorId)
        .set(HEADER_GAME_ID, gameId)
        .set(HEADER_OVERWRITES_EXISTING, "false")
        .attach(FIELD_WINDOWS, unityGameWindowsPath)
        .expect(STATUS_CODE_SUCCESS)
        .expect(
          `{"paths":["${path.join(
            URL_PREFIX_GAME,
            creatorId,
            gameId,
            FIELD_WINDOWS
          )}"]}`
        )
        .end(done);
    });
  });
});
