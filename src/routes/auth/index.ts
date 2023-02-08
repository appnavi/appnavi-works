import express from "express";
import createError from "http-errors";
import { isAuthenticated } from "../../services/auth";
import { STATUS_CODE_UNAUTHORIZED } from "../../utils/constants";
import { render } from "../../utils/helpers";
import { guestRouter } from "./guest";
import { createSlackAuthRouter } from "./slack";

export function createAuthRouter(slackStrategyName: string) {
  const authRouter = express.Router();

  authRouter.get("/error", (_req, _res, next) => {
    next(createError(STATUS_CODE_UNAUTHORIZED));
  });

  authRouter.get("/logout", (req, res) => {
    req.logout(() => {
      req.session.destroy(() => {
        res.redirect("/auth");
      });
    });
  });

  authRouter.use("/", (req, res, next) => {
    if (isAuthenticated(req)) {
      res.redirect("/");
      return;
    }
    next();
  });

  authRouter.get("/", function (req, res) {
    render("auth", req, res);
  });
  authRouter.use("/slack", createSlackAuthRouter(slackStrategyName));
  authRouter.use("/guest", guestRouter);
  return authRouter;
}
