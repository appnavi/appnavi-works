import express from "express";
import { passport } from "../app";
import * as logger from "../modules/logger";
import { findOrCreateUser, isAuthenticated, redirect } from "../services/auth";
import { getEnv, render, wrap } from "../utils/helpers";

const authRouter = express.Router();

authRouter.get("/error", (req, res, next) => {
  next(new Error("ログイン失敗"));
});

authRouter.get("/", function (req, res) {
  if (isAuthenticated(req)) {
    res.redirect("/");
    return;
  }
  render("auth/login", req, res);
});
authRouter.get("/slack", passport.authenticate("slack"));
authRouter.get(
  "/redirect",
  passport.authenticate("slack", {
    failureRedirect: "/auth/error",
  }),
  wrap(async (req, res, next) => {
    const workspaceId = req.user?.team?.id;
    if (workspaceId !== getEnv("SLACK_WORKSPACE_ID")) {
      logger.system.error(
        `違うワークスペース${workspaceId ?? ""}の人がログインしようとしました。`
      );
      res.send("認証に失敗しました。").status(403).end();
      return;
    }
    const userId = req.user?.user?.id ?? "";
    logger.system.info(`ユーザー${userId}がSlack認証でログインしました。`);

    const userDocument = await findOrCreateUser(req);
    await userDocument.updateOne({
      $set: {
        lastLogIn: new Date(),
      },
    });
    next();
  }),
  (req, res) => {
    redirect(req, res);
  }
);

authRouter.all("/logout", (req, res) => {
  req.session = undefined;
  res.redirect("/auth");
});

export { authRouter };
