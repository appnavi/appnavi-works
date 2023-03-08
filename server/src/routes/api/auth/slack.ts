import express from "express";
import passport from "passport";
import { STRATEGY_NAME_SLACK } from "../../../config/passport";
import { afterSlackLogin, logLastLogin } from "../../../services/auth";
import { wrap } from "../../../utils/helpers";

const slackRouter = express.Router();
slackRouter.get("/", passport.authenticate(STRATEGY_NAME_SLACK));
slackRouter.get(
  "/redirect",
  passport.authenticate(STRATEGY_NAME_SLACK, {
    failureRedirect: "/auth/error",
  }),
  afterSlackLogin,
  wrap(logLastLogin),
  (_req, res) => {
    res.redirect("/");
  }
);

export { slackRouter };
