import bcrypt from "bcrypt";
import { PassportStatic } from "passport";
import {
  Strategy as LocalStrategy,
  IVerifyOptions as LocalIVerifyOptions,
} from "passport-local";
import OAuth2Strategy from "passport-oauth2";
import { Strategy as SlackStrategy } from "passport-slack";
import * as yup from "yup";
import { UserModel } from "../models/database";
import * as logger from "../modules/logger";
const slackStrategy = new SlackStrategy(
  {
    clientID: process.env["SLACK_CLIENT_ID"] ?? "",
    clientSecret: process.env["SLACK_CLIENT_SECRET"] ?? "",
    callbackURL: process.env["SLACK_REDIRECT_URI"] ?? "",
    skipUserProfile: false,
    user_scope: [
      "identity.basic",
      "identity.email",
      "identity.avatar",
      "identity.team",
    ], // default
  },
  function (
    _accessToken: string,
    _refreshToken: string,
    profile: Express.User,
    done: OAuth2Strategy.VerifyCallback
  ) {
    return done(null, profile);
  }
);
const yupSchemaLocal = yup.object({
  userId: yup.string().required(),
  password: yup.string().required(),
});
const localStrategy = new LocalStrategy(
  {
    usernameField: "userId",
  },
  (
    userId: string,
    password: string,
    done: (
      error: unknown,
      user: unknown | undefined,
      options: LocalIVerifyOptions | undefined
    ) => void
  ) => {
    yupSchemaLocal
      .validate({
        userId,
        password,
      })
      .then(() => UserModel.find({ userId }))
      .then((users) => {
        if (users.length == 0) {
          throw new Error("存在しないユーザーです。");
        }
        if (users.length > 1) {
          throw new Error("userIdが同じ複数のユーザーが存在します。");
        }
        const user = users[0];
        const hashedPassword = user.hashedPassword;
        if (hashedPassword === undefined) {
          throw new Error("パスワードではログインできません。");
        }
        return bcrypt.compare(password, hashedPassword);
      })
      .then(() => {
        const user: GuestUser = {
          id: userId,
          name: "ゲスト",
          isGuest: true,
        };
        done(undefined, user, undefined);
      })
      .catch((e) => {
        logger.system.error("ログインに失敗しました。", e);
        done(undefined, false, { message: "ログインに失敗しました。" });
      });
  }
);
function preparePassport(passport: PassportStatic): void {
  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  passport.deserializeUser(function (user, done) {
    done(null, user as Express.User);
  });

  passport.use(slackStrategy);
  passport.use(localStrategy);
}

export { preparePassport };
