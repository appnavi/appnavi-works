import {
  Issuer,
  Strategy as OpenIdStrategy,
  TokenSet,
  UserinfoResponse,
} from "openid-client";
import * as logger from "../../modules/logger";
import { env, getSiteURLWithoutTrailingSlash } from "../../utils/env";

export async function createSlackStrategy() {
  const issuer = await Issuer.discover("https://slack.com");
  const client = new issuer.Client({
    client_id: env.SLACK_CLIENT_ID,
    client_secret: env.SLACK_CLIENT_SECRET,
    redirect_uris: [
      `${getSiteURLWithoutTrailingSlash()}/api/auth/slack/redirect`,
    ],
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
      done: (err: unknown, user?: Record<string, unknown>) => void,
    ) => {
      // Workspace IDのチェック
      // アプリNaviのSlackワークスペース以外からのログインを防止（おそらく起こり得ないが一応）
      const workspaceId = user["https://slack.com/team_id"];
      if (typeof workspaceId !== "string") {
        logger.system.error(
          "ログインしようとした人のワークスペースが不明です。",
          user,
        );
        done(new Error("ログイン失敗"), undefined);
        return;
      }
      if (workspaceId !== env.SLACK_WORKSPACE_ID) {
        logger.system.error(
          `違うワークスペース${workspaceId}の人がログインしようとしました。`,
          user,
        );
        done(new Error("ログイン失敗"), undefined);
        return;
      }
      // Workspace IDのチェック 終わり

      // アバターURLの取得
      // ページ右上に表示するアイコンのURLを取得
      const avater_url_key = Object.keys(user).find((x) =>
        x.startsWith("https://slack.com/user_image_"),
      );
      const avatar_url =
        avater_url_key != undefined ? user[avater_url_key] : undefined;
      // アバターURLの取得 終わり

      const id = user.sub;

      return done(null, {
        id,
        name: user.name,
        avatar_url,
        type: "Slack",
      });
    },
  );
}
