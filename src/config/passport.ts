import { Request } from "express";
import {
  Issuer,
  Strategy as OpenIdStrategy,
  TokenSet,
  UserinfoResponse,
} from "openid-client";
import passport, { Strategy } from "passport";
import {
  Strategy as LocalStrategy,
} from "passport-local";
import { z } from "zod";
import { UserModel } from "../models/database";
import * as logger from "../modules/logger";
import { findUserOrThrow } from "../services/auth";
import { verifyPassword } from "../services/auth/password";
import { env, getSiteURLWithoutTrailingSlash, } from "../utils/env"
import { randomStringCharacters, } from "../utils/helpers";
import { isUser } from "../utils/types";
export const guestUserIdRegex = new RegExp(
  `^guest-[${randomStringCharacters}]+$`
);
const guestUserPasswordRegex = new RegExp(`^[${randomStringCharacters}]+$`);
export const localLoginInputSchema = z.object({
  userId: z.string().regex(guestUserIdRegex),
  password: z.string().regex(guestUserPasswordRegex),
});
async function loginLocal(
  input: { userId: string; password: string }
) {
  const { userId, password } = await localLoginInputSchema.parseAsync(input)
  const users = await UserModel.find({ userId })
  if (users.length == 0) {
    throw new Error("存在しないユーザーです。");
  }
  if (users.length > 1) {
    throw new Error("userIdが同じ複数のユーザーが存在します。");
  }
  const guest = users[0].guest;
  if (guest === undefined) {
    throw new Error("パスワードではログインできません。");
  }
  const hashedPassword = guest.hashedPassword;
  const isPasswordCorrect = await verifyPassword(
    password,
    hashedPassword
  );
  if (!isPasswordCorrect) {
    throw new Error("パスワードが異なります。");
  }
  const resultUser: Express.User = {
    id: userId,
    name: "ゲストユーザー",
    type: "Guest",
  }
  return resultUser
}
const localStrategy = new LocalStrategy(
  {
    usernameField: "userId",
  },
  (
    userId,
    password,
    done
  ) => {
    loginLocal({ userId, password }).then(user => {
      done(undefined, user, undefined);
    }).catch((e) => {
      const err = e as { message: string; errors?: string[] };
      const errors = err.errors ?? [err.message];
      logger.system.error("ログインに失敗しました。", {
        errors,
        userId,
      });
      done(undefined, false, { message: "ログインに失敗しました。" });
    });
  }
);
async function createSlackStrategy(): Promise<Strategy> {
  const issuer = await Issuer.discover("https://slack.com");
  const client = new issuer.Client({
    client_id: env.SLACK_CLIENT_ID,
    client_secret: env.SLACK_CLIENT_SECRET,
    redirect_uris: [`${getSiteURLWithoutTrailingSlash()}/auth/slack/redirect`],
    response_types: ["code"],
  });
  return new OpenIdStrategy(
    {
      client,
      params: {
        scope: "openid profile",
      },
    },
    (
      _tokenSet: TokenSet,
      user: UserinfoResponse,
      done: (err: unknown, user?: Record<string, unknown>) => void
    ) => {
      // Workspace IDのチェック
      // アプリNaviのSlackワークスペース以外からのログインを防止（おそらく起こり得ないが一応）
      const workspaceId = user["https://slack.com/team_id"];
      if (typeof workspaceId !== "string") {
        logger.system.error(
          "ログインしようとした人のワークスペースが不明です。",
          user
        );
        done(new Error("ログイン失敗"), undefined);
        return;
      }
      if (workspaceId !== env.SLACK_WORKSPACE_ID) {
        logger.system.error(
          `違うワークスペース${workspaceId}の人がログインしようとしました。`,
          user
        );
        done(new Error("ログイン失敗"), undefined);
        return;
      }
      // Workspace IDのチェック 終わり

      // アバターURLの取得
      // ページ右上に表示するアイコンのURLを取得
      const avater_url_key = Object.keys(user).find((x) =>
        x.startsWith("https://slack.com/user_image_")
      );
      const avatar_url =
        avater_url_key != undefined ? user[avater_url_key] : undefined;
      // アバターURLの取得 終わり

      // IDのチェック
      // 2022/03/11に行ったユーザーID取得方法の修正により、それ以前にログインした人のIDが変わる可能性があるため、その対策。（おそらく起こりえないが一応）
      // TODO:2022/03/11以前にログインしたことがあり今後もログインする可能性のあるユーザー全員が一度ログインして、警告（「user.sub(...」）がログに記録されてなければ、このコードを`const id = user.sub;`に置き換え。
      let id = user.sub;
      const slack_user_id = user["https://slack.com/user_id"];
      if (typeof slack_user_id === "string" && id !== slack_user_id) {
        id = slack_user_id;
        logger.system.warn(
          `user.sub(${user.sub})とuser["https://slack.com/user_id"](${slack_user_id})が異なっています。
          互換性のため、user.subの代わりにuser["https://slack.com/user_id"]をユーザーIDとしました。`,
          user
        );
      }
      // IDのチェック 終わり

      return done(null, {
        id,
        name: user.name,
        avatar_url,
        type: "Slack",
      });
    }
  );
}
async function validateUserForDeserialize(
  user: unknown
): Promise<Express.User> {
  if (!isUser(user)) throw new Error("User型として認識できませんでした。");
  const userDocument = await findUserOrThrow(user.id);
  if (user.type == "Slack" && userDocument.guest !== undefined)
    throw new Error("Slackユーザーとしては不適切なユーザーです。");
  if (user.type == "Guest" && userDocument.guest === undefined)
    throw new Error("Guestユーザーとしては不適切なユーザーです。");
  return user;
}

async function preparePassport(): Promise<void> {
  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  passport.deserializeUser(function (
    req: Request,
    user: unknown,
    done: (err: unknown, user?: Express.User | false | null) => void
  ) {
    validateUserForDeserialize(user)
      .then((validatedUser) => {
        done(null, validatedUser);
      })
      .catch((err) => {
        logger.system.error("deserializeUserに失敗しました。", user, err);
        req.session.destroy(() => {
          done(
            new Error("認証に問題が発生しました。再度ログインしてください。"),
            null
          );
        });
      });
  });
  const slackStrategy = await createSlackStrategy();
  passport.use(slackStrategy);
  passport.use(localStrategy);
}

export { preparePassport };
