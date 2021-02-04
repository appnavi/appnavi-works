import express from "express";
import { passport } from "../app";
import { User } from "../models/database";
import * as logger from "../modules/logger";
import {
  ensureAuthenticated,
  getDefaultCreatorId,
  isAuthenticated,
  redirect,
} from "../services/auth";
import { creatorIdSchema } from "../services/upload";
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
    const defaultCreatorId = await getDefaultCreatorId(req);
    render("auth/profile", req, res, {
      defaultCreatorId: defaultCreatorId,
    });
  })
  .post(ensureAuthenticated,async (req, res, next) => {
    const defaultCreatorId = (req.body as Record<string, unknown>)[
      "default_creator_id"
    ] as string;
    try{
      await creatorIdSchema.validate(defaultCreatorId);
    }catch(e){
      const err = e as { name: string; errors: string[] };
      const message = err.errors[0];
      res.status(500).send(message);
      return;
    }
    const user = req.user as { user: { id: string } };
    User.updateOne(
      {
        userId: user.user.id,
      },
      {
        $set: {
          defaultCreatorId: defaultCreatorId,
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
