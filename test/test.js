const request = require("supertest");
const app = require("../dist/app");
const passportStub = require('passport-stub');
const fs = require('fs-extra');
const path = require("path");
const STATUS_CODE_SUCCESS = 200;

async function removeAllUploads() {
  const dir = path.join(__dirname, "../uploads")
  const files = await fs.readdir(dir);
  files.forEach(async(f) => {
    await fs.remove(path.join(dir, f));
  });
}

function requireAuthenticated(path, done) {
  return request(app).get(path).expect(302)
    .expect("Location", "/auth")
    .end(done);
}
function canAccessTo(path, done) {
  return request(app).get(path).expect(STATUS_CODE_SUCCESS)
    .expect("Content-Type", /html/)
    .end((err, res) => {
      if (err) throw err;
      if (res.redirect) {
        throw new Error("リダイレクトしています。")
      }
      done();
    });
}
function login(){
  passportStub.install(app);
  passportStub.login({
    ok: true,
    user: {
      name: "test_user_name",
      id: "test_user_id",
      email: "test_user_email",
      image_24: "test_user_image_24",
      image_32: "test_user_image_32",
      image_48: "test_user_image_48",
      image_72: "test_user_image_72",
      image_192: "test_user_image_192",
      image_512: "test_user_image_512",
    },
    team: {
      id: "test_team_id",
      name: "test_team_name",
      domain: "test_team_domain",
      image_34: "test_team_image_34",
      image_44: "test_team_image_44",
      image_68: "test_team_image_68",
      image_88: "test_team_image_88",
      image_102: "test_team_image_102",
      image_132: "test_team_image_132",
      image_230: "test_team_image_230",
      image_default: "test_team_image_default",
    },
    provider: "test_provider",
    id: "test_id",
    displayName: "test_display_name",
  });
}
function logout(){
  passportStub.logout();
  passportStub.uninstall(app);
}


describe("非ログイン時のGET", () => {
  describe("authRouter", () => {
    it("/authをGETできる", (done) => {
      canAccessTo("/auth", done);
    });
    it("/auth/slackをGETするとSlackの認証ページにリダイレクトされる", (done) => {
      request(app).get("/auth/slack")
        .expect(302)
        .expect("Location", /^https:\/\/slack.com\/oauth\/v2\/authorize/)
        .end(done);
    });
    it("/auth/profileはログイン必須", (done) => {
      requireAuthenticated("/auth/profile", done);
    });
    it("/auth/logoutをGETするとログイン画面にリダイレクトされる", (done) => {
      request(app).get("/auth/logout")
        .expect(302)
        .expect("Location", "/auth")
        .end(done);
    });
  });
  describe("gamesRouter", () => {
    it("/gamesページをGETできる(URLは/games/になる)", (done) => {
      request(app).get("/games")
        .expect("Content-Type", /html/)
        .expect(301)
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

describe("ログイン時のGET", () => {
  before(login);
  after(logout);
  describe("authRouter", () => {
    it("/authをGETをGETすると/にリダイレクトされる", (done) => {
      request(app).get("/auth")
        .expect(302)
        .expect("Location", "/")
        .end(done);
    });
    it("/auth/slackをGETするとSlackの認証ページにリダイレクトされる", (done) => {
      request(app).get("/auth/slack")
        .expect(302)
        .expect("Location", /^https:\/\/slack.com\/oauth\/v2\/authorize/)
        .end(done);
    });
    it("/auth/profileをGETできる", (done) => {
      canAccessTo("/auth/profile", done);
    });
    it("/auth/logoutをGETするとログイン画面にリダイレクトされる", (done) => {
      request(app).get("/auth/logout")
        .expect(302)
        .expect("Location", "/auth")
        .end(done);
    });
  });
  describe("gamesRouter", () => {
    it("/gamesページをGETできる(URLは/games/になる)", (done) => {
      request(app).get("/games")
        .expect("Content-Type", /html/)
        .expect(301)
        .expect("Location", "/games/")
        .end(done);
    });
    it("/games/ページをGETできる", (done) => {
      request(app).get("/games/")
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

// describe("ゲームアップロード", ()=>{
//   describe("Unity", ()=>{
//     describe("非ログイン時", ()=>{
//       it("条件を満たしていても、ファイルアップロードに失敗する", (done)=>{
//         request(app).post("/upload/unity")
//       });
//     });
//     describe("ログイン時", ()=>{
//       before(login);
//       after(logout);
      
//     });
//   });
// });