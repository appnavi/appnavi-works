import express from "express";
import request from "request";
import jwt from "jsonwebtoken";
import { isAuthenticated, redirect } from "../services/auth";
const router = express.Router();
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
    uri: `https://slack.com/api/oauth.v2.access?code=${code}&client_id=${
      process.env.SLACK_CLIENT_ID ?? ""
    }&client_secret=${process.env.SLACK_CLIENT_SECRET ?? ""}`,
    method: "GET",
  };
  request(options, (error, response, body) => {
    const JSONresponse = JSON.parse(body) as SlackAuthResponse;
    if (!JSONresponse.ok) {
      console.log(JSON.parse(body));
      res
        .send("認証に失敗しました。")
        .status(200)
        .end();
      return;
    }
    //Sign In With Slackは、SLACK_CLIENT_IDとSLACK_CLIENT_SECRETの発行元のワークスペースの人しかログインできないと思っているが、
    //どんなSlackアカウントでもログインできる可能性があるので、その対策
    if(typeof process.env.SLACK_CLIENT_ID !== 'string' || JSONresponse.team.id !== process.env.SLACK_WORKSPACE_ID){
      console.log(`${JSONresponse.team.id} ${process.env.SLACK_WORKSPACE_ID ?? ""}`);
      res
      .send("認証に失敗しました。")
      .status(200)
      .end();
      return;
    }
    const oauth = {
      accessToken: JSONresponse.authed_user.access_token,
    };
    req.session.oauth = oauth;
    req.session.token = jwt.sign(oauth, process.env.JWT_SECRET ?? "");
    redirect(req, res);
  });
});

router.all("/logout", (req, res) => {
  req.session.token = undefined;
  req.session.oauth = undefined;
  res.redirect("/auth");
});

export { router };
