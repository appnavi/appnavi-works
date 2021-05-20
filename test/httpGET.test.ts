import request from "supertest";
import { app } from "../src/app";
import { login, logout, myId } from "./auth";
import { clearData, connectDatabase } from "./common";
import {
  STATUS_CODE_SUCCESS,
  STATUS_CODE_REDIRECT_PERMANENT,
  STATUS_CODE_REDIRECT_TEMPORARY,
} from "../src/utils/constants";
const passportStub = require("passport-stub");

function requireAuthenticated(path: string, done: jest.DoneCallback) {
  return request(app)
    .get(path)
    .expect(STATUS_CODE_REDIRECT_TEMPORARY)
    .expect("Location", "/auth")
    .end(done);
}
function canAccessTo(path: string, done: jest.DoneCallback) {
  return request(app)
    .get(path)
    .expect(STATUS_CODE_SUCCESS)
    .expect("Content-Type", /html/)
    .end((err, res) => {
      if (err) throw err;
      if (res.redirect) {
        throw new Error("リダイレクトしています。");
      }
      done();
    });
}

describe("GET", () => {
  beforeAll(async () => {
    await connectDatabase();
    await clearData();
  });
  describe("非ログイン時", () => {
    describe("authRouter", () => {
      it("/authをGETできる", (done) => {
        canAccessTo("/auth", done);
      });
      it("/auth/slackをGETするとSlackの認証ページにリダイレクトされる", (done) => {
        request(app)
          .get("/auth/slack")
          .expect(STATUS_CODE_REDIRECT_TEMPORARY)
          .expect("Location", /^https:\/\/slack.com\/oauth\/v2\/authorize/)
          .end(done);
      });
      it("/accountはログイン必須", (done) => {
        requireAuthenticated("/account", done);
      });
      it("/auth/logoutをGETするとログイン画面にリダイレクトされる", (done) => {
        request(app)
          .get("/auth/logout")
          .expect(STATUS_CODE_REDIRECT_TEMPORARY)
          .expect("Location", "/auth")
          .end(done);
      });
    });
    describe("worksRouter", () => {
      it("/worksページをGETできる(URLは/works/になる)", (done) => {
        request(app)
          .get("/works")
          .expect("Content-Type", /html/)
          .expect(STATUS_CODE_REDIRECT_PERMANENT)
          .expect("Location", "/works/")
          .end(done);
      });
      it("/works/ページをGETできる", (done) => {
        canAccessTo("/works/", done);
      });
    });
    describe("indexRouter", () => {
      it("/はログイン必須", (done) => {
        requireAuthenticated("/", done);
      });
    });
    describe("uploadRouter", () => {
      it("/upload/unityはログイン必須", (done) => {
        requireAuthenticated("/upload/unity", done);
      });
    });
  });

  describe("ログイン時", () => {
    beforeAll(() => login(app, myId));
    afterAll(() => logout(app));
    describe("authRouter", () => {
      it("/authをGETをGETすると/にリダイレクトされる", (done) => {
        request(app)
          .get("/auth")
          .expect(STATUS_CODE_REDIRECT_TEMPORARY)
          .expect("Location", "/")
          .end(done);
      });
      it("/auth/slackをGETするとSlackの認証ページにリダイレクトされる", (done) => {
        request(app)
          .get("/auth/slack")
          .expect(STATUS_CODE_REDIRECT_TEMPORARY)
          .expect("Location", /^https:\/\/slack.com\/oauth\/v2\/authorize/)
          .end(done);
      });
      it("/accountをGETできる", (done) => {
        canAccessTo("/account", done);
      });
      it("/auth/logoutをGETするとログイン画面にリダイレクトされる", (done) => {
        request(app)
          .get("/auth/logout")
          .expect(STATUS_CODE_REDIRECT_TEMPORARY)
          .expect("Location", "/auth")
          .end(done);
      });
    });
    describe("worksRouter", () => {
      it("/worksページをGETできる(URLは/works/になる)", (done) => {
        request(app)
          .get("/works")
          .expect("Content-Type", /html/)
          .expect(STATUS_CODE_REDIRECT_PERMANENT)
          .expect("Location", "/works/")
          .end(done);
      });
      it("/works/ページをGETできる", (done) => {
        request(app)
          .get("/works/")
          .expect("Content-Type", /html/)
          .expect(STATUS_CODE_SUCCESS)
          .end(done);
      });
    });
    describe("indexRouter", () => {
      it("/をGETできる", (done) => {
        canAccessTo("/", done);
      });
    });
    describe("uploadRouter", () => {
      it("/upload/unityをGETできる", (done) => {
        canAccessTo("/upload/unity", done);
      });
    });
  });
});
