import express from "express";
import { passport } from "../app";
import { User } from "../models/database";
import * as logger from "../modules/logger";
import {
  ensureAuthenticated,
  findUser,
  isAuthenticated,
  redirect,
} from "../services/auth";
import { getContentSecurityPolicy, getEnv, render } from "../utils/helpers";

const authRouter = express.Router();
authRouter.use(
  getContentSecurityPolicy({
    "img-src": [
      "'self'",
      "secure.gravatar.com",
      "i0.wp.com",
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

authRouter
  .route("/profile")
  .get(ensureAuthenticated, async (req, res) => {
    const userDocument = await findUser(req);
    const userData = userDocument?.toObject() as Record<string, unknown>;
    console.log(userData?.defaultAuthorId);
    render("auth/profile", req, res, {
      defaultAuthorId: userData?.defaultAuthorId,
    });
  })
  .post(ensureAuthenticated, (req, res, next) => {
    const defaultAuthorId = (req.body as Record<string, unknown>)[
      "default_author_id"
    ] as string;
    if (defaultAuthorId === undefined) {
      res.status(500).send("デフォルト著者IDが設定されていません。");
      return;
    }
    const user = req.user as { user: { id: string } };
    User.updateOne(
      {
        userId: user.user.id,
      },
      {
        $set: {
          defaultAuthorId: defaultAuthorId,
        },
      },
      { upsert: true },
      (err) => {
        if (err) {
          next(err);
          return;
        }
        res.send("OK");
      }
    );
  });

authRouter.all("/logout", (req, res) => {
  req.session = undefined;
  res.redirect("/auth");
});

export { authRouter };
