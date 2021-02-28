import express from "express";
import mongoose from "mongoose";
import request from "supertest";
import { app } from "../src/app";
import { FIELD_WINDOWS } from "../src/services/upload";
import {
  URL_PREFIX_GAME,
  DIRECTORY_UPLOADS_DESTINATION,
  STATUS_CODE_FAILURE,
  STATUS_CODE_SUCCESS,
  STATUS_CODE_UNAUTHORIZED,
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
        .set("x-game-id", gameId)
        .set("x-overwrites-existing", "false")
        .attach(FIELD_WINDOWS, unityGameWindowsPath)
        .expect(STATUS_CODE_FAILURE)
        .expect("作者IDは必須です。")
        .end(done);
    });
    it("作者IDが設定されていないとアップロードできない", (done) => {
      request(app)
        .post("/upload/unity")
        .set("x-creator-id", encodeURI("テスト"))
        .set("x-game-id", gameId)
        .set("x-overwrites-existing", "false")
        .attach(FIELD_WINDOWS, unityGameWindowsPath)
        .expect(STATUS_CODE_FAILURE)
        .expect(
          "作者IDには数字・アルファベット小文字・ハイフンのみ使用できます。"
        )
        .end(done);
    });
    it("ゲームIDが設定されていないとアップロードできない", (done) => {
      request(app)
        .post("/upload/unity")
        .set("x-creator-id", creatorId)
        .set("x-overwrites-existing", "false")
        .attach(FIELD_WINDOWS, unityGameWindowsPath)
        .expect(STATUS_CODE_FAILURE)
        .expect("ゲームIDは必須です。")
        .end(done);
    });
    it("作者IDが設定されていないとアップロードできない", (done) => {
      request(app)
        .post("/upload/unity")
        .set("x-creator-id", creatorId)
        .set("x-game-id", encodeURI("テスト"))
        .set("x-overwrites-existing", "false")
        .attach(FIELD_WINDOWS, unityGameWindowsPath)
        .expect(STATUS_CODE_FAILURE)
        .expect(
          "ゲームIDには数字・アルファベット小文字・ハイフンのみ使用できます。"
        )
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
            .set("x-creator-id", creatorId)
            .set("x-game-id", gameId)
            .set("x-overwrites-existing", "false")
            .attach(FIELD_WINDOWS, unityGameWindowsPath)
            .expect(STATUS_CODE_FAILURE)
            .expect(
              "ゲームが既に存在しています。上書きする場合はチェックボックスにチェックを入れてください"
            )
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
            .set("x-creator-id", creatorId)
            .set("x-game-id", gameId)
            .set("x-overwrites-existing", "true")
            .attach(FIELD_WINDOWS, unityGameWindowsPath)
            .expect(STATUS_CODE_FAILURE)
            .expect(
              "別の人が既に投稿したゲームがあります。上書きすることはできません。"
            )
            .end(done);
        });
    });
    it("条件を満たしていればアップロードできる", (done) => {
      request(app)
        .post("/upload/unity")
        .set("x-creator-id", creatorId)
        .set("x-game-id", gameId)
        .set("x-overwrites-existing", "false")
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
