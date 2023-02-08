import request from "supertest";
import { createApp } from "../src/app";
import { preparePassport } from "../src/config/passport";
import { login, logout, myId } from "./auth";
import { connectDatabase, ensureUploadFoldersExist } from "./common";
import {
  STATUS_CODE_SUCCESS,
  STATUS_CODE_REDIRECT_PERMANENT,
  STATUS_CODE_REDIRECT_TEMPORARY,
} from "../src/utils/constants";
import { Express } from "express";

function requireAuthenticated(
  app: Express,
  path: string,
  done: jest.DoneCallback
) {
  return request(app)
    .get(path)
    .expect(STATUS_CODE_REDIRECT_TEMPORARY)
    .expect("Location", "/auth")
    .end(done);
}
function canAccessTo(app: Express, path: string, done: jest.DoneCallback) {
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
  let app: Express;
  beforeAll(async () => {
    app = await createApp();
    await preparePassport();
    await connectDatabase("1");
    await ensureUploadFoldersExist();
  });
  describe("非ログイン時", () => {
    describe("authRouter", () => {
      it("/authをGETできる", (done) => {
        canAccessTo(app, "/auth", done);
      });
      it("/auth/guestをGETできる", (done) => {
        canAccessTo(app, "/auth/guest", done);
      });
      it("/auth/slackをGETするとSlackの認証ページにリダイレクトされる", (done) => {
        request(app)
          .get("/auth/slack")
          .expect(STATUS_CODE_REDIRECT_TEMPORARY)
          .expect(
            "Location",
            /^https:\/\/slack.com\/openid\/connect\/authorize/
          )
          .end(done);
      });
      it("/auth/logoutをGETするとログイン画面にリダイレクトされる", (done) => {
        request(app)
          .get("/auth/logout")
          .expect(STATUS_CODE_REDIRECT_TEMPORARY)
          .expect("Location", "/auth")
          .end(done);
      });
    });
    describe("accountRouter", () => {
      it("/accountはログイン必須", (done) => {
        requireAuthenticated(app, "/account", done);
      });
      it("/account/guestはログイン必須", (done) => {
        requireAuthenticated(app, "/account/guest", done);
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
        canAccessTo(app, "/works/", done);
      });
    });
    describe("indexRouter", () => {
      it("/はログイン必須", (done) => {
        requireAuthenticated(app, "/", done);
      });
    });
    describe("uploadRouter", () => {
      it("/upload/unityはログイン必須", (done) => {
        requireAuthenticated(app, "/upload/unity", done);
      });
    });
    describe("dbRouter", () => {
      it("/db/worksはログイン必須", (done) => {
        requireAuthenticated(app, "/db/works", done);
      });
      it("/db/works/rawはログイン必須", (done) => {
        requireAuthenticated(app, "/db/works/raw", done);
      });
      it("/db/usersはログイン必須", (done) => {
        requireAuthenticated(app, "/db/users", done);
      });
      it("/db/users/rawはログイン必須", (done) => {
        requireAuthenticated(app, "/db/users/raw", done);
      });
    });
  });

  describe("ログイン時", () => {
    beforeEach(() => login(app, myId));
    afterEach(logout);
    describe("authRouter", () => {
      it("/authをGETすると/にリダイレクトされる", (done) => {
        request(app)
          .get("/auth")
          .expect(STATUS_CODE_REDIRECT_TEMPORARY)
          .expect("Location", "/")
          .end(done);
      });
      it("/auth/guestをGETすると/にリダイレクトされる", (done) => {
        request(app)
          .get("/auth/guest")
          .expect(STATUS_CODE_REDIRECT_TEMPORARY)
          .expect("Location", "/")
          .end(done);
      });
      it("/auth/slackをGETすると/にリダイレクトされる", (done) => {
        request(app)
          .get("/auth/slack")
          .expect(STATUS_CODE_REDIRECT_TEMPORARY)
          .expect("Location", "/")
          .end(done);
      });
    });
    describe("accountRouter", () => {
      it("/accountをGETできる", (done) => {
        canAccessTo(app, "/account", done);
      });
      it("/account/guestをGETできる", (done) => {
        canAccessTo(app, "/account/guest", done);
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
        canAccessTo(app, "/", done);
      });
    });
    describe("uploadRouter", () => {
      it("/upload/unityをGETできる", (done) => {
        canAccessTo(app, "/upload/unity", done);
      });
    });
    describe("dbRouter", () => {
      it("/db/worksをGETできる", (done) => {
        canAccessTo(app, "/db/works", done);
      });
      it("/db/works/rawをGETできる", (done) => {
        canAccessTo(app, "/db/works/raw", done);
      });
      it("/db/usersをGETできる", (done) => {
        canAccessTo(app, "/db/users", done);
      });
      it("/db/users/rawをGETできる", (done) => {
        canAccessTo(app, "/db/users/raw", done);
      });
    });
  });
});
