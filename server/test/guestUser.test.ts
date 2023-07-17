import request from "supertest";
import { app } from "../src/app";
import { preparePassport } from "../src/config/passport";
import {
  STATUS_CODE_SUCCESS,
  STATUS_CODE_UNAUTHORIZED,
  STATUS_CODE_REDIRECT_TEMPORARY,
  ERROR_MESSAGE_GUEST_LOGIN_FAIL,
  ERROR_MESSAGE_GUEST_LOGIN_EXCEED_RATE_LIMIT,
} from "../src/utils/constants";
import { connectDatabase, clearDatabase, wrap } from "./common";
import { UserModel } from "../src/models/database";
import { guestLoginRateLimiter } from "../src/routes/api/auth/guest";
import { hashPassword } from "../src/services/auth/password";

function resetRateLimit(): void {
  guestLoginRateLimiter.resetKey("::ffff:127.0.0.1");
}

async function testInvalidGuestLogin(
  textShouldContainInRes: string,
): Promise<void> {
  return new Promise((resolve) => {
    request(app)
      .post("/api/auth/guest")
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
  password: string,
): Promise<void> {
  return new Promise<void>((resolve) => {
    request(app)
      .post("/api/auth/guest")
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
const guestId = "guest-abcde";
const password = "password";

describe("ゲストユーザー", () => {
  let hashedPassword: string;
  beforeAll(async () => {
    await preparePassport();
    await connectDatabase("guest-user");
    hashedPassword = await hashPassword(password);
  });
  beforeEach(resetRateLimit);
  afterEach(async () => {
    await clearDatabase();
  });
  describe("ゲストユーザーのログイン", () => {
    it(
      "存在しないゲストユーザーとしてログインすることはできない。",
      wrap(async (done) => {
        request(app)
          .post("/api/auth/guest")
          .send({
            userId: guestId,
            password,
          })
          .expect(STATUS_CODE_UNAUTHORIZED)
          .expect(JSON.stringify({ error: ERROR_MESSAGE_GUEST_LOGIN_FAIL }))
          .end(done);
      }),
    );
    it(
      "パスワードが異なる場合はログインできない。",
      wrap(async (done) => {
        await UserModel.create({ userId: guestId, guest: { hashedPassword } });
        request(app)
          .post("/api/auth/guest")
          .send({
            userId: guestId,
            password: `${password}1`,
          })
          .expect(STATUS_CODE_UNAUTHORIZED)
          .expect(JSON.stringify({ error: ERROR_MESSAGE_GUEST_LOGIN_FAIL }))
          .end(done);
      }),
    );
    it(
      "作成されたゲストユーザーでログインできる。",
      wrap(async (done) => {
        await UserModel.create({ userId: guestId, guest: { hashedPassword } });
        request(app)
          .post("/api/auth/guest")
          .send({
            userId: guestId,
            password,
          })
          .expect(STATUS_CODE_SUCCESS)
          .end(done);
      }),
    );
  });
  describe("ゲストログインの総当たり攻撃対策", () => {
    it(
      "3回ログインに失敗すると4回目以降はログインできないメッセージを表示",
      wrap(async (done) => {
        for (let i = 1; i <= 3; ++i) {
          await testInvalidGuestLogin(ERROR_MESSAGE_GUEST_LOGIN_FAIL);
        }
        for (let i = 1; i <= 4; ++i) {
          await testInvalidGuestLogin(
            ERROR_MESSAGE_GUEST_LOGIN_EXCEED_RATE_LIMIT,
          );
        }
        done();
      }),
    );
    it(
      "3回ログインに失敗すると4回目以降は必ずログインに失敗する。",
      wrap(async (done) => {
        await UserModel.create({ userId: guestId, guest: { hashedPassword } });
        for (let i = 1; i <= 3; ++i) {
          await testInvalidGuestLogin(ERROR_MESSAGE_GUEST_LOGIN_FAIL);
        }
        request(app)
          .post("/api/auth/guest")
          .send({
            userId: guestId,
            password,
          })
          .expect(STATUS_CODE_UNAUTHORIZED)
          .end((err, res) => {
            if (err) {
              done(err);
            }
            expect(
              res.text.includes(ERROR_MESSAGE_GUEST_LOGIN_EXCEED_RATE_LIMIT),
            ).toBe(true);
            done();
          });
      }),
    );
    it(
      "2回ログインに失敗しても3回目に成功すればログインできる。",
      wrap(async (done) => {
        await UserModel.create({ userId: guestId, guest: { hashedPassword } });
        await testInvalidGuestLogin(ERROR_MESSAGE_GUEST_LOGIN_FAIL);
        await testInvalidGuestLogin(ERROR_MESSAGE_GUEST_LOGIN_FAIL);
        await testSuccessfulGuestLogin(guestId, password);
        done();
      }),
    );
    it(
      "ログインに成功すればログイン失敗回数の制限がリセットされる。",
      wrap(async (done) => {
        await UserModel.create({ userId: guestId, guest: { hashedPassword } });
        for (let i = 1; i <= 2; ++i) {
          await testInvalidGuestLogin(ERROR_MESSAGE_GUEST_LOGIN_FAIL);
          await testInvalidGuestLogin(ERROR_MESSAGE_GUEST_LOGIN_FAIL);
          await testSuccessfulGuestLogin(guestId, password);
          await testSuccessfulLogout();
        }
        done();
      }),
    );
  });
});
