import express from "express";
import passport from "passport";
import { User } from "../../../common/types";
import { STRATEGY_NAME_SLACK } from "../../../config/passport";
import * as logger from "../../../modules/logger";
import { logLastLogin } from "../../../services/auth";
import { wrap } from "../../../utils/helpers";

const slackRouter = express.Router();
slackRouter.get("/", passport.authenticate(STRATEGY_NAME_SLACK));
slackRouter.get(
  "/redirect",
  passport.authenticate(STRATEGY_NAME_SLACK, {
    failureRedirect: "/auth/error",
  }),
  (req, res, next) => {
    const parsed = User.safeParse(req.user);
    if (!parsed.success) {
      logger.system.error(`ログインできていません。`, req.user);
      res.redirect("/api/auth/error");
      return;
    }
    const user = parsed.data;
    if (user.type !== "Slack") {
      logger.system.error(`Slackによるログインではありません。`, req.user);
      res.redirect("/api/auth/error");
      return;
    }
    logger.system.info(`ユーザー${user.id}がSlack認証でログインしました。`);
    next();
  },
  wrap(logLastLogin),
  (_req, res) => {
    res.redirect("/");
  }
);

export { slackRouter };
