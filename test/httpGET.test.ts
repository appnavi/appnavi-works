import request from "supertest";
import { app } from "../src/app";
import { preparePassport } from "../src/config/passport";
import { login, logout, myId } from "./auth";
import { connectDatabase, ensureUploadFoldersExist } from "./common";
import {
  STATUS_CODE_SUCCESS,
  STATUS_CODE_REDIRECT_PERMANENT,
  STATUS_CODE_REDIRECT_TEMPORARY,
} from "../src/utils/constants";

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
    await preparePassport();
    await connectDatabase("1");
    await ensureUploadFoldersExist();
  });
  describe("非ログイン時", () => {
    describe("authRouter", () => {
      it("/authをGETできる", (done) => {
        canAccessTo("/auth", done);
      });
      it("/auth/guestをGETできる", (done) => {
        canAccessTo("/auth/guest", done);
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
        requireAuthenticated("/account", done);
      });
      it("/account/guestはログイン必須", (done) => {
        requireAuthenticated("/account/guest", done);
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
    describe("dbRouter", () => {
      it("/db/worksはログイン必須", (done) => {
        requireAuthenticated("/db/works", done);
      });
      it("/db/works/rawはログイン必須", (done) => {
        requireAuthenticated("/db/works/raw", done);
      });
      it("/db/usersはログイン必須", (done) => {
        requireAuthenticated("/db/users", done);
      });
      it("/db/users/rawはログイン必須", (done) => {
        requireAuthenticated("/db/users/raw", done);
      });
    });
  });

  describe("ログイン時", () => {
    beforeEach(() => login(app, myId));
    afterEach(() => logout(app));
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
        canAccessTo("/account", done);
      });
      it("/account/guestをGETできる", (done) => {
        canAccessTo("/account/guest", done);
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
    describe("dbRouter", () => {
      it("/db/worksをGETできる", (done) => {
        canAccessTo("/db/works", done);
      });
      it("/db/works/rawをGETできる", (done) => {
        canAccessTo("/db/works/raw", done);
      });
      it("/db/usersをGETできる", (done) => {
        canAccessTo("/db/users", done);
      });
      it("/db/users/rawをGETできる", (done) => {
        canAccessTo("/db/users/raw", done);
      });
    });
  });
});
