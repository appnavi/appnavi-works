import express from "express";
import jwt from "jsonwebtoken";
import request from "request";
import { getEnv, getContentSecurityPolicy } from "../helpers";
import * as logger from "../modules/logger";
import { isAuthenticated, redirect } from "../services/auth";

const router = express.Router();
router.use(
  getContentSecurityPolicy({
    "img-src": [
      "'self'",
      "https://api.slack.com/img/sign_in_with_slack.png",
      "https://a.slack-edge.com/80588/img/sign_in_with_slack.png",
    ],
  })
);
interface SlackAuthResponse {
  ok: boolean;
  app_id: string;
  authed_user: {
    id: string;
    scope: string;
    access_token: string;
    token_type: string;
  };
  team: {
    id: string;
  };
  enterprise: unknown;
  is_enterprise_install: boolean;
}

/* GET home page. */
router.get("/", function (req, res) {
  if (isAuthenticated(req)) {
    res.redirect("/");
    return;
  }
  res.render("login");
});
router.get("/redirect", (req, res) => {
  const code = req.query.code;
  if (typeof code !== "string") {
    res.redirect("/auth");
    return;
  }
  const options = {
    uri: `https://slack.com/api/oauth.v2.access?code=${code}&client_id=${getEnv(
      "SLACK_CLIENT_ID"
    )}&client_secret=${getEnv("SLACK_CLIENT_SECRET")}`,
    method: "GET",
  };
  request(options, (error, response, body) => {
    const JSONresponse = JSON.parse(body) as SlackAuthResponse;
    if (!JSONresponse.ok) {
      logger.system.error("Slack認証失敗", JSON.parse(body));
      res.send("認証に失敗しました。").status(200).end();
      return;
    }
    //Sign In With Slackは、SLACK_CLIENT_IDとSLACK_CLIENT_SECRETの発行元のワークスペースの人しかログインできないはず
    //（違うワークスペースからログインしようとすると、"invalid_team_for_non_distributed_app"というエラーになる）
    //もし違うワークスペースの人がログインに成功した場合、認証失敗とする
    if (JSONresponse.team.id !== getEnv("SLACK_WORKSPACE_ID")) {
      logger.system.error(
        `違うワークスペース${JSONresponse.team.id}の人がログインしようとしました。`
      );
      res.send("認証に失敗しました。").status(200).end();
      return;
    }
    logger.system.info(
      `ユーザー${JSONresponse.authed_user.id}がSlack認証でログインしました。`
    );
    const oauth = {
      accessToken: JSONresponse.authed_user.access_token,
    };
    req.session.oauth = oauth;
    req.session.token = jwt.sign(oauth, getEnv("JWT_SECRET"));
    redirect(req, res);
  });
});

router.all("/logout", (req, res) => {
  req.session.token = undefined;
  req.session.oauth = undefined;
  res.redirect("/auth");
});

export { router };
