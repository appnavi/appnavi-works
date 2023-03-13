import request from "supertest";
import { app } from "../src/app";
import { myId, createLogin } from "./auth";
import { connectDatabase, ensureUploadFoldersEmpty, wrap } from "./common";
import {
  STATUS_CODE_SUCCESS,
  STATUS_CODE_REDIRECT_PERMANENT,
  STATUS_CODE_REDIRECT_TEMPORARY,
} from "../src/utils/constants";
import { preparePassport } from "../src/config/passport";
import supertest from "supertest";

function requireAuthenticated(path: string, done: jest.DoneCallback) {
  return request(app)
    .get(path)
    .expect(STATUS_CODE_REDIRECT_TEMPORARY)
    .expect("Location", "/auth")
    .end(done);
}
function canAccessTo(
  withLogIn: boolean,
  path: string,
  done: jest.DoneCallback
) {
  const test = (req: supertest.Test) => {
    req
      .expect(STATUS_CODE_SUCCESS)
      .expect("Content-Type", /html/)
      .end((err, res) => {
        if (err) throw err;
        if (res.redirect) {
          throw new Error("リダイレクトしています。");
        }
        done();
      });
  };
  if (!withLogIn) {
    test(request(app).get(path));
    return;
  }
  createLogin(myId)
    .then(({ login }) => {
      test(login(request(app).get(path)));
    })
    .catch(done);
}

describe.skip("GET", () => {
  beforeAll(async () => {
    await preparePassport();
    await connectDatabase("1");
    await ensureUploadFoldersEmpty();
  });
  describe("非ログイン時", () => {
    describe("API", () => {
      describe("authRouter", () => {
        it.skip("/authをGETできる", (done) => {
          canAccessTo(false, "/auth", done);
        });
        it.skip("/auth/guestをGETできる", (done) => {
          canAccessTo(false, "/auth/guest", done);
        });
        it("/api/auth/logoutをGETするとログイン画面にリダイレクトされる", (done) => {
          request(app)
            .get("/api/auth/logout")
            .expect(STATUS_CODE_REDIRECT_TEMPORARY)
            .expect("Location", "/auth")
            .end(done);
        });
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
        canAccessTo(false, "/works/", done);
      });
    });
    describe("indexRouter", () => {
      it.skip("/はログイン必須", (done) => {
        requireAuthenticated("/", done);
      });
    });
    describe("uploadRouter", () => {
      it.skip("/upload/unityはログイン必須", (done) => {
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
    describe.skip("authRouter", () => {
      it(
        "/authをGETすると/にリダイレクトされる",
        wrap(async (done) => {
          const { login } = await createLogin(myId);
          login(request(app).get("/auth"))
            .expect(STATUS_CODE_REDIRECT_TEMPORARY)
            .expect("Location", "/")
            .end(done);
        })
      );
      it(
        "/auth/guestをGETすると/にリダイレクトされる",
        wrap(async (done) => {
          const { login } = await createLogin(myId);
          login(request(app).get("/auth/guest"))
            .expect(STATUS_CODE_REDIRECT_TEMPORARY)
            .expect("Location", "/")
            .end(done);
        })
      );
      it(
        "/auth/slackをGETすると/にリダイレクトされる",
        wrap(async (done) => {
          const { login } = await createLogin(myId);
          login(request(app).get("/auth/slack"))
            .expect(STATUS_CODE_REDIRECT_TEMPORARY)
            .expect("Location", "/")
            .end(done);
        })
      );
    });
    describe("accountRouter", () => {
      it("/accountをGETできる", (done) => {
        canAccessTo(true, "/account", done);
      });
      it("/account/guestをGETできる", (done) => {
        canAccessTo(true, "/account/guest", done);
      });
    });
    describe("worksRouter", () => {
      it(
        "/worksページをGETできる(URLは/works/になる)",
        wrap(async (done) => {
          const { login } = await createLogin(myId);
          login(request(app).get("/works"))
            .expect("Content-Type", /html/)
            .expect(STATUS_CODE_REDIRECT_PERMANENT)
            .expect("Location", "/works/")
            .end(done);
        })
      );
      it(
        "/works/ページをGETできる",
        wrap(async (done) => {
          const { login } = await createLogin(myId);
          login(request(app).get("/works/"))
            .expect("Content-Type", /html/)
            .expect(STATUS_CODE_SUCCESS)
            .end(done);
        })
      );
    });
    describe("indexRouter", () => {
      it.skip("/をGETできる", (done) => {
        canAccessTo(true, "/", done);
      });
    });
    describe("uploadRouter", () => {
      it.skip("/upload/unityをGETできる", (done) => {
        canAccessTo(true, "/upload/unity", done);
      });
    });
    describe("dbRouter", () => {
      it("/db/worksをGETできる", (done) => {
        canAccessTo(true, "/db/works", done);
      });
      it("/db/works/rawをGETできる", (done) => {
        canAccessTo(true, "/db/works/raw", done);
      });
      it("/db/usersをGETできる", (done) => {
        canAccessTo(true, "/db/users", done);
      });
      it("/db/users/rawをGETできる", (done) => {
        canAccessTo(true, "/db/users/raw", done);
      });
    });
  });
});
