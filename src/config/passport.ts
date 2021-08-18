import bcrypt from "bcrypt";
import {
  Issuer,
  Strategy as OpenIdStrategy,
  TokenSet,
  UserinfoResponse,
} from "openid-client";
import passport, { Strategy } from "passport";
import {
  Strategy as LocalStrategy,
  IVerifyOptions as LocalIVerifyOptions,
} from "passport-local";
import * as yup from "yup";
import { UserModel } from "../models/database";
import * as logger from "../modules/logger";
import { getEnv, isSlackUser } from "../utils/helpers";

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
        const guest = users[0].guest;
        if (guest === undefined) {
          throw new Error("パスワードではログインできません。");
        }
        const hashedPassword = guest.hashedPassword;
        return bcrypt.compare(password, hashedPassword);
      })
      .then(() => {
        const user: Express.User = {
          id: userId,
          name: "ゲストユーザー",
          type: "Guest",
        };
        done(undefined, user, undefined);
      })
      .catch((e) => {
        logger.system.error("ログインに失敗しました。", e);
        done(undefined, false, { message: "ログインに失敗しました。" });
      });
  }
);
async function createSlackStrategy(): Promise<Strategy> {
  const issuer = await Issuer.discover("https://slack.com");
  const client = new issuer.Client({
    client_id: getEnv("SLACK_CLIENT_ID"),
    client_secret: getEnv("SLACK_CLIENT_SECRET"),
    redirect_uris: [getEnv("SLACK_REDIRECT_URI")],
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
      user: UserinfoResponse<Record<string, unknown>, Record<string, unknown>>,
      done: (err: unknown, user?: Record<string, unknown>) => void
    ) => {
      if (!isSlackUser(user)) {
        logger.system.error(`Slackユーザーとして認識できませんでした。`, user);
        done(new Error("ログイン失敗"), undefined);
        return;
      }
      const workspaceId = user["https://slack.com/team_id"];
      if (workspaceId !== getEnv("SLACK_WORKSPACE_ID")) {
        logger.system.error(
          `違うワークスペース${workspaceId}の人がログインしようとしました。`,
          user
        );
        done(new Error("ログイン失敗"), undefined);
        return;
      }
      return done(null, {
        id: user["https://slack.com/user_id"],
        name: user.name,
        avatar_url: user["https://slack.com/user_image_24"],
        type: "Slack",
      });
    }
  );
}
async function preparePassport(): Promise<void> {
  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  passport.deserializeUser(function (user, done) {
    done(null, user as Express.User);
  });
  const slackStrategy = await createSlackStrategy();
  passport.use(slackStrategy);
  passport.use(localStrategy);
}

export { preparePassport };
