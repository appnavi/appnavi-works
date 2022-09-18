import express from "express";
import rateLimit from "express-rate-limit";
import createError from "http-errors";
import passport from "passport";
import * as logger from "../../modules/logger";
import {
  afterGuestLogIn,
  isAuthenticated,
  logLastLogin,
  redirect,
} from "../../services/auth";
import {
  ERROR_MESSAGE_GUEST_LOGIN_EXCEED_RATE_LIMIT,
  ERROR_MESSAGE_GUEST_LOGIN_FAIL,
  STATUS_CODE_UNAUTHORIZED,
} from "../../utils/constants";
import { render } from "../../utils/helpers";
import { slackRouter } from "./slack";

const authRouter = express.Router();

// ゲストログインの失敗は1時間に3回まで
export const guestLoginRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    logger.system.error(`ログイン失敗回数が制限を超えました。`, req.ip);
    res.status(STATUS_CODE_UNAUTHORIZED);
    render("auth/guest", req, res, {
      error: ERROR_MESSAGE_GUEST_LOGIN_EXCEED_RATE_LIMIT,
    });
  },
  keyGenerator: (req) => req.ip,
});

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
authRouter
  .route("/guest")
  .get((req, res) => {
    render("auth/guest", req, res);
  })
  .post(
    guestLoginRateLimiter,
    passport.authenticate("local", { failWithError: true }),
    afterGuestLogIn,
    logLastLogin,
    (req, res) => {
      guestLoginRateLimiter.resetKey(req.ip);
      redirect(req, res);
    }
  );

authRouter.use(
  "/guest",
  (
    err: Record<string, unknown>,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    // ログイン試行回数を超過した場合にはここは呼ばれない。
    if (
      typeof err.status === "number" &&
      err.status === STATUS_CODE_UNAUTHORIZED
    ) {
      render("auth/guest", req, res, {
        error: ERROR_MESSAGE_GUEST_LOGIN_FAIL,
      });
      return;
    }
    next(err);
  }
);
authRouter.use("/slack", slackRouter);

export { authRouter };
