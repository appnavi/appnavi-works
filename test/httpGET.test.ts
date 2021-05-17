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

function requireAuthenticated(path: string, done: Mocha.Done) {
  return request(app)
    .get(path)
    .expect(STATUS_CODE_REDIRECT_TEMPORARY)
    .expect("Location", "/auth")
    .end(done);
}
function canAccessTo(path: string, done: Mocha.Done) {
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
  before(async () => {
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
      it("/profileはログイン必須", (done) => {
        requireAuthenticated("/profile", done);
      });
      it("/auth/logoutをGETするとログイン画面にリダイレクトされる", (done) => {
        request(app)
          .get("/auth/logout")
          .expect(STATUS_CODE_REDIRECT_TEMPORARY)
          .expect("Location", "/auth")
          .end(done);
      });
    });
    describe("gamesRouter", () => {
      it("/gamesページをGETできる(URLは/games/になる)", (done) => {
        request(app)
          .get("/games")
          .expect("Content-Type", /html/)
          .expect(STATUS_CODE_REDIRECT_PERMANENT)
          .expect("Location", "/games/")
          .end(done);
      });
      it("/games/ページをGETできる", (done) => {
        canAccessTo("/games/", done);
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
    before(() => login(app, myId));
    after(() => logout(app));
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
      it("/profileをGETできる", (done) => {
        canAccessTo("/profile", done);
      });
      it("/auth/logoutをGETするとログイン画面にリダイレクトされる", (done) => {
        request(app)
          .get("/auth/logout")
          .expect(STATUS_CODE_REDIRECT_TEMPORARY)
          .expect("Location", "/auth")
          .end(done);
      });
    });
    describe("gamesRouter", () => {
      it("/gamesページをGETできる(URLは/games/になる)", (done) => {
        request(app)
          .get("/games")
          .expect("Content-Type", /html/)
          .expect(STATUS_CODE_REDIRECT_PERMANENT)
          .expect("Location", "/games/")
          .end(done);
      });
      it("/games/ページをGETできる", (done) => {
        request(app)
          .get("/games/")
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
