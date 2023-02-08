import express from "express";
import passport from "passport";
import { afterSlackLogin, logLastLogin } from "../../services/auth";
import { wrap } from "../../utils/helpers";

export function createSlackAuthRouter(slackStrategyName: string) {
  const slackRouter = express.Router();
  slackRouter.get("/", passport.authenticate(slackStrategyName));
  slackRouter.get(
    "/redirect",
    passport.authenticate(slackStrategyName, {
      failureRedirect: "/auth/error",
    }),
    afterSlackLogin,
    wrap(logLastLogin),
    (_req, res) => {
      res.redirect("/");
    }
  );
  return slackRouter;
}
