import request from "supertest";
import { app } from "../src/app";
import { preparePassport, localLoginInputSchema } from "../src/config/passport";
import {
  STATUS_CODE_BAD_REQUEST,
  ERROR_MESSAGE_GUEST_ID_REQUIRED as GUEST_ID_REQUIRED,
  ERROR_MESSAGE_GUEST_ID_INVALID as GUEST_ID_INVALID,
  ERROR_MESSAGE_GUEST_NOT_FOUND as GUEST_NOT_FOUND,
  ERROR_MESSAGE_NOT_GUEST_USER as NOT_GUEST_USER,
  ERROR_MESSAGE_GUEST_DIFFERENT_CREATOR as GUEST_DIFFERENT_CREATOR,
  ERROR_MESSAGE_GUEST_WORKS_NOT_EMPTY as GUEST_WORKS_NOT_EMPTY,
  STATUS_CODE_SUCCESS,
  STATUS_CODE_UNAUTHORIZED,
  STATUS_CODE_REDIRECT_TEMPORARY,
  ERROR_MESSAGE_GUEST_LOGIN_FAIL as GUEST_LOGIN_FAIL,
  ERROR_MESSAGE_GUEST_LOGIN_EXCEED_RATE_LIMIT as GUEST_LOGIN_EXCEED_RATE_LIMIT,
} from "../src/utils/constants";
import { login, logout, myId, theirId } from "./auth";
import { connectDatabase, clearDatabase, INVALID_ID } from "./common";
import { UserModel, WorkModel } from "../src/models/database";
import { guestLoginRateLimiter } from "../src/routes/auth/guest";
import { verifyPassword } from "../src/services/auth/password";

function getIdAndPassFromCreateGuestHtml(html: string): {
  guestId: string;
  password: string;
} {
  const regex = /value="([^"]*)"/g;
  let match = regex.exec(html);
  const guestId = match![1];
  match = regex.exec(html);
  const password = match![1];
  return {
    guestId,
    password,
  };
}
function resetRateLimit(): void {
  guestLoginRateLimiter.resetKey("::ffff:127.0.0.1");
}

async function testSuccessfulGuestUserCreation(logoutOnEnd: boolean): Promise<{
  guestId: string;
  password: string;
}> {
  return new Promise<{
    guestId: string;
    password: string;
  }>((resolve) => {
    login(app, myId);
    request(app)
      .post("/account/guest/create")
      .expect(STATUS_CODE_SUCCESS)
      .end((err, res) => {
        expect(err).toBeNull();
        resolve(getIdAndPassFromCreateGuestHtml(res.text));
      });
  }).then(async (result) => {
    const { userId, password } = await localLoginInputSchema.parse({
      userId: result.guestId,
      password: result.password,
    });
    const guests = await UserModel.find({
      userId,
      "guest.createdBy": {
        $eq: myId,
      },
    });
    expect(guests.length).toBe(1);
    await verifyPassword(password, guests[0].guest?.hashedPassword ?? "");
    if (logoutOnEnd) {
      logout();
    }
    return { guestId: userId, password };
  });
}
async function testInvalidGuestLogin(
  textShouldContainInRes: string
): Promise<void> {
  return new Promise((resolve) => {
    request(app)
      .post("/auth/guest")
      .send({
        userId: "invalid-guest-id",
        password: "password",
      })
      .expect(401)
      .end((err, res) => {
        expect(err).toBeNull();
        expect(res.text.includes(textShouldContainInRes)).toBe(true);
        resolve();
      });
  });
}
async function testSuccessfulGuestLogin(
  userId: string,
  password: string
): Promise<void> {
  return new Promise<void>((resolve) => {
    request(app)
      .post("/auth/guest")
      .send({
        userId,
        password,
      })
      .expect(STATUS_CODE_REDIRECT_TEMPORARY)
      .expect("Location", "/")
      .end(resolve);
  });
}
async function testSuccessfulLogout(): Promise<void> {
  return new Promise<void>((resolve) => {
    request(app)
      .get("/auth/logout")
      .expect(STATUS_CODE_REDIRECT_TEMPORARY)
      .expect("Location", "/auth")
      .end(resolve);
  });
}
const otherGuestId = "guest-other";
describe("ゲストユーザー", () => {
  beforeAll(async () => {
    await preparePassport();
    await connectDatabase("4");
  });
  afterEach(async () => {
    logout();
    await clearDatabase();
  });
  describe("ゲストユーザーの作成", () => {
    it("ログインしていなければゲストユーザーを作成できない。", (done) => {
      request(app)
        .post("/account/guest/create")
        .expect(STATUS_CODE_UNAUTHORIZED)
        .end(done);
    });
    it("条件を満たしていればゲストユーザーの作成に成功する。", (done) => {
      testSuccessfulGuestUserCreation(false).then(() => done());
    });
  });
  describe("ゲストユーザーの削除", () => {
    it("ログインしていなければゲストユーザーを削除できない。", (done) => {
      request(app)
        .post("/account/guest/delete")
        .expect(STATUS_CODE_UNAUTHORIZED)
        .end(done);
    });
    it("IDが設定されていないとゲストユーザーを削除できない。", (done) => {
      login(app, myId);
      request(app)
        .post("/account/guest/delete")
        .expect(STATUS_CODE_BAD_REQUEST)
        .expect(JSON.stringify({ errors: [GUEST_ID_REQUIRED] }))
        .end(done);
    });
    it("IDが不適切だとゲストユーザーを削除できない。", (done) => {
      login(app, myId);
      request(app)
        .post("/account/guest/delete")
        .send({ guestId: INVALID_ID })
        .expect(STATUS_CODE_BAD_REQUEST)
        .expect(JSON.stringify({ errors: [GUEST_ID_INVALID] }))
        .end(done);
    });
    it("存在しないゲストユーザーを削除できない。", (done) => {
      login(app, myId);
      request(app)
        .post("/account/guest/delete")
        .send({ guestId: otherGuestId })
        .expect(STATUS_CODE_BAD_REQUEST)
        .expect(JSON.stringify({ errors: [GUEST_NOT_FOUND] }))
        .end(done);
    });
    it("ゲストユーザーではないユーザーを削除できない。", (done) => {
      UserModel.create({
        userId: otherGuestId,
      }).then(() => {
        login(app, myId);
        request(app)
          .post("/account/guest/delete")
          .send({ guestId: otherGuestId })
          .expect(STATUS_CODE_BAD_REQUEST)
          .expect(JSON.stringify({ errors: [NOT_GUEST_USER] }))
          .end(done);
      });
    });
    it("別のユーザーが作成したゲストユーザーを削除できない。", (done) => {
      testSuccessfulGuestUserCreation(true).then(({ guestId }) => {
        login(app, theirId);
        request(app)
          .post("/account/guest/delete")
          .send({ guestId })
          .expect(STATUS_CODE_BAD_REQUEST)
          .expect(JSON.stringify({ errors: [GUEST_DIFFERENT_CREATOR] }))
          .end(done);
      });
    });
    it("作品が存在するゲストユーザーを削除できない。", (done) => {
      testSuccessfulGuestUserCreation(false).then(({ guestId }) => {
        WorkModel.create({
          owner: guestId,
        }).then(() => {
          request(app)
            .post("/account/guest/delete")
            .send({ guestId: guestId })
            .expect(STATUS_CODE_BAD_REQUEST)
            .expect(JSON.stringify({ errors: [GUEST_WORKS_NOT_EMPTY] }))
            .end(done);
        });
      });
    });
    it("条件を満たしていればゲストユーザーの削除に成功する。", (done) => {
      testSuccessfulGuestUserCreation(false).then(({ guestId }) => {
        request(app)
          .post("/account/guest/delete")
          .send({ guestId })
          .expect(STATUS_CODE_SUCCESS)
          .end(done);
      });
    });
  });
  describe("ゲストユーザーのログイン", () => {
    beforeEach(resetRateLimit);
    it("存在しないゲストユーザーとしてログインすることはできない。", (done) => {
      testSuccessfulGuestUserCreation(true).then(({ guestId, password }) => {
        request(app)
          .post("/auth/guest")
          .send({
            userId: "admin",
            password,
          })
          .expect(STATUS_CODE_UNAUTHORIZED)
          .end(done);
      });
    });
    it("存在しないゲストユーザーとしてログインすることはできない。その2", (done) => {
      testSuccessfulGuestUserCreation(true).then(({ guestId, password }) => {
        request(app)
          .post("/auth/guest")
          .send({
            userId: `${guestId}1`,
            password,
          })
          .expect(STATUS_CODE_UNAUTHORIZED)
          .end(done);
      });
    });
    it("パスワードが異なる場合はログインできない。", (done) => {
      testSuccessfulGuestUserCreation(true).then(({ guestId, password }) => {
        request(app)
          .post("/auth/guest")
          .send({
            userId: guestId,
            password: `${password}-1`,
          })
          .expect(STATUS_CODE_UNAUTHORIZED)
          .end(done);
      });
    });
    it("作成されたゲストユーザーでログインできる。", (done) => {
      testSuccessfulGuestUserCreation(true).then(({ guestId, password }) => {
        request(app)
          .post("/auth/guest")
          .send({
            userId: guestId,
            password,
          })
          .expect(STATUS_CODE_REDIRECT_TEMPORARY)
          .expect("Location", "/")
          .end(done);
      });
    });
  });
  describe("ゲストユーザーの権限", () => {
    it("ゲストユーザーは作成したゲストユーザー一覧ページにアクセスできない。", (done) => {
      login(app, myId, "Guest");
      request(app)
        .get("/account/guest")
        .expect(STATUS_CODE_UNAUTHORIZED)
        .end(done);
    });
    it("ゲストユーザーは作品一覧ページにアクセスできない。", (done) => {
      login(app, myId, "Guest");
      request(app).get("/db/works").expect(STATUS_CODE_UNAUTHORIZED).end(done);
    });
    it("ゲストユーザーはユーザー一覧ページにアクセスできない。", (done) => {
      login(app, myId, "Guest");
      request(app).get("/db/users").expect(STATUS_CODE_UNAUTHORIZED).end(done);
    });
    it("ゲストユーザーはデータベース内容の出力(WORKS)ページにアクセスできない。", (done) => {
      login(app, myId, "Guest");
      request(app)
        .get("/db/works/raw")
        .expect(STATUS_CODE_UNAUTHORIZED)
        .end(done);
    });
    it("ゲストユーザーはデータベース内容の出力(USER)ページにアクセスできない。", (done) => {
      login(app, myId, "Guest");
      request(app)
        .get("/db/users/raw")
        .expect(STATUS_CODE_UNAUTHORIZED)
        .end(done);
    });
    it("ゲストユーザーはゲストユーザーを作成できない。", (done) => {
      login(app, myId, "Guest");
      request(app)
        .post("/account/guest/create")
        .expect(STATUS_CODE_UNAUTHORIZED)
        .end(done);
    });
    it("ゲストユーザーはゲストユーザーを削除できない。", (done) => {
      login(app, myId, "Guest");
      request(app)
        .post("/account/guest/delete")
        .expect(STATUS_CODE_UNAUTHORIZED)
        .end(done);
    });
  });
  describe("ゲストログインの総当たり攻撃対策", () => {
    beforeEach(resetRateLimit);
    it("3回ログインに失敗すると4回目以降はログインできないメッセージを表示", (done) => {
      testInvalidGuestLogin(GUEST_LOGIN_FAIL)
        .then(() => testInvalidGuestLogin(GUEST_LOGIN_FAIL))
        .then(() => testInvalidGuestLogin(GUEST_LOGIN_FAIL))
        .then(() => testInvalidGuestLogin(GUEST_LOGIN_EXCEED_RATE_LIMIT))
        .then(() => testInvalidGuestLogin(GUEST_LOGIN_EXCEED_RATE_LIMIT))
        .then(() => testInvalidGuestLogin(GUEST_LOGIN_EXCEED_RATE_LIMIT))
        .then(done);
    });
    it("3回ログインに失敗すると4回目以降は必ずログインに失敗する。", (done) => {
      testSuccessfulGuestUserCreation(true).then(({ guestId, password }) => {
        testInvalidGuestLogin(GUEST_LOGIN_FAIL)
          .then(() => testInvalidGuestLogin(GUEST_LOGIN_FAIL))
          .then(() => testInvalidGuestLogin(GUEST_LOGIN_FAIL))
          .then(() => {
            request(app)
              .post("/auth/guest")
              .send({
                userId: guestId,
                password,
              })
              .expect(STATUS_CODE_UNAUTHORIZED)
              .end((err, res) => {
                expect(err).toBeNull();
                expect(res.text.includes(GUEST_LOGIN_EXCEED_RATE_LIMIT)).toBe(
                  true
                );
                done();
              });
          });
      });
    });
    it("2回ログインに失敗しても3回目に成功すればログインできる。", (done) => {
      testSuccessfulGuestUserCreation(true).then(({ guestId, password }) => {
        testInvalidGuestLogin(GUEST_LOGIN_FAIL)
          .then(() => testInvalidGuestLogin(GUEST_LOGIN_FAIL))
          .then(() => testSuccessfulGuestLogin(guestId, password))
          .then(done);
      });
    });
    it("ログインに成功すればログイン失敗回数の制限がリセットされる。", (done) => {
      testSuccessfulGuestUserCreation(true).then(({ guestId, password }) => {
        testInvalidGuestLogin(GUEST_LOGIN_FAIL)
          .then(() => testInvalidGuestLogin(GUEST_LOGIN_FAIL))
          .then(() => testSuccessfulGuestLogin(guestId, password))
          .then(testSuccessfulLogout)
          .then(() => testInvalidGuestLogin(GUEST_LOGIN_FAIL))
          .then(() => testInvalidGuestLogin(GUEST_LOGIN_FAIL))
          .then(() => testSuccessfulGuestLogin(guestId, password))
          .then(done);
      });
    });
  });
});
