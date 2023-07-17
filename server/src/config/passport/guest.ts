import { Strategy as LocalStrategy } from "passport-local";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { UserModel } from "../../models/database";
import * as logger from "../../modules/logger";
import { hashPassword, verifyPassword } from "../../services/auth/password";

export const localLoginInputSchema = z.object({
  userId: z.string(),
  password: z.string(),
});
async function findGuestOrError(userId: string) {
  const users = await UserModel.find({ userId });
  if (users.length == 0) {
    return { guest: null, errorMessage: "存在しないユーザーです。" };
  }
  if (users.length > 1) {
    return {
      guest: null,
      errorMessage: "userIdが同じ複数のユーザーが存在します。",
    };
  }
  const guest = users[0].guest;
  if (guest === undefined) {
    return { guest: null, errorMessage: "パスワードではログインできません。" };
  }
  return { guest, errorMessage: null };
}
async function loginLocal(
  input: { userId: string; password: string },
  dummyPassword: string,
  dummyHashedPassword: string,
) {
  const parsed = localLoginInputSchema.safeParse(input);
  if (!parsed.success) {
    throw fromZodError(parsed.error);
  }
  const { userId, password } = parsed.data;
  const { guest, errorMessage } = await findGuestOrError(userId);
  console.log("1");
  if (guest === null) {
    console.log("2");
    // ゲストユーザーが見つからなかったときでもパスワードチェックを行う。
    // これにより、ゲストユーザーが存在するか否かをレスポンス時間の違いで判別不可能にする。
    await verifyPassword(dummyPassword, dummyHashedPassword);
    throw new Error(errorMessage);
  }
  console.log("3");
  const hashedPassword = guest.hashedPassword;
  console.log("4");
  const isPasswordCorrect = await verifyPassword(password, hashedPassword);
  console.log("5");
  if (!isPasswordCorrect) {
    throw new Error("パスワードが異なります。");
  }
  console.log("6");
  return {
    id: userId,
    name: "ゲストユーザー",
    type: "Guest",
  } as Express.User;
}

export async function createGuestStrategy() {
  const dummyPassword = "dummyPassword";
  const dummyHashedPassword = await hashPassword(`${dummyPassword}1`);
  const localStrategy = new LocalStrategy(
    {
      usernameField: "userId",
    },
    (userId, password, done) => {
      loginLocal({ userId, password }, dummyPassword, dummyHashedPassword)
        .then((user) => {
          done(undefined, user, undefined);
        })
        .catch((e) => {
          const err = e as { message: string; errors?: string[] };
          const errors = err.errors ?? [err.message];
          logger.system.error("ログインに失敗しました。", {
            errors,
            userId,
          });
          done(undefined, false, { message: "ログインに失敗しました。" });
        });
    },
  );
  return localStrategy;
}
