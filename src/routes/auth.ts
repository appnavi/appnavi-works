import express from "express";
import { passport } from "../app";
import * as logger from "../modules/logger";
import { isAuthenticated, redirect } from "../services/auth";
import { getContentSecurityPolicy, getEnv } from "../utils/helpers";

const authRouter = express.Router();
authRouter.use(
  getContentSecurityPolicy({
    "img-src": [
      "'self'",
      "https://api.slack.com/img/sign_in_with_slack.png",
      "https://a.slack-edge.com/80588/img/sign_in_with_slack.png",
    ],
  })
);

authRouter.get("/error", (req, res, next) => {
  next(new Error("ログイン失敗"));
});

authRouter.get("/", function (req, res) {
  if (isAuthenticated(req)) {
    res.redirect("/");
    return;
  }
  res.render("auth/login");
});
authRouter.get("/slack", passport.authenticate("slack"));
authRouter.get(
  "/redirect",
  passport.authenticate("slack", {
    failureRedirect: "/auth/error",
  }),
  //TODO：ユーザー記録機能実装
  (req, res, next) => {
    const user = req.user as { team: { id: string }; user: { id: string } };
    const workspaceId = user?.team?.id;
    if (workspaceId !== getEnv("SLACK_WORKSPACE_ID")) {
      logger.system.error(
        `違うワークスペース${workspaceId}の人がログインしようとしました。`
      );
      res.send("認証に失敗しました。").status(403).end();
      return;
    }
    logger.system.info(
      `ユーザー${user.user.id}がSlack認証でログインしました。`
    );
    next();
  },
  (req, res) => {
    redirect(req, res);
  }
);

authRouter.all("/logout", (req, res) => {
  req.session = undefined;
  res.redirect("/auth");
});

export { authRouter };
