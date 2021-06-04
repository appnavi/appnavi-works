import express from "express";
import createError from "http-errors";
import { passport } from "../app";
import * as logger from "../modules/logger";
import { findOrCreateUser, isAuthenticated, redirect } from "../services/auth";
import { STATUS_CODE_UNAUTHORIZED } from "../utils/constants";
import { getEnv, render, wrap } from "../utils/helpers";

const authRouter = express.Router();

authRouter.get("/error", (_req, _res, next) => {
  next(createError(STATUS_CODE_UNAUTHORIZED));
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
  validateSlackUser,
  wrap(async (req, _res, next) => {
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

function validateSlackUser(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const workspaceId = req.user?.team?.id;
  if (workspaceId !== getEnv("SLACK_WORKSPACE_ID")) {
    logger.system.error(
      `違うワークスペース${workspaceId ?? ""}の人がログインしようとしました。`
    );
    res.redirect("/auth/error");
    return;
  }
  const userId = req.user?.id;
  if (userId === undefined) {
    logger.system.error(`ユーザーIDが取得できませんでした`, req.user);
    res.redirect("/auth/error");
    return;
  }
  logger.system.info(`ユーザー${userId}がSlack認証でログインしました。`);
  next();
}

export { authRouter };
