import express from "express";
import rateLimit from "express-rate-limit";
import passport from "passport";
import { User } from "../../../common/types";
import { STRATEGY_NAME_GUEST } from "../../../config/passport";
import * as logger from "../../../modules/logger";
import { logLastLogin } from "../../../services/auth";
import {
  ERROR_MESSAGE_GUEST_LOGIN_EXCEED_RATE_LIMIT,
  ERROR_MESSAGE_GUEST_LOGIN_FAIL,
  STATUS_CODE_SUCCESS,
  STATUS_CODE_UNAUTHORIZED,
} from "../../../utils/constants";

// ゲストログインの失敗は1時間に3回まで
export const guestLoginRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    logger.system.error(`ログイン失敗回数が制限を超えました。`, req.ip);
    res.status(STATUS_CODE_UNAUTHORIZED).send({
      error: ERROR_MESSAGE_GUEST_LOGIN_EXCEED_RATE_LIMIT,
    });
  },
  keyGenerator: (req) => req.ip,
});

const guestRouter = express.Router();

guestRouter.route("/").post(
  guestLoginRateLimiter,
  passport.authenticate(STRATEGY_NAME_GUEST, { failWithError: true }),
  (req, res, next) => {
    const parsed = User.safeParse(req.user);
    if (!parsed.success) {
      logger.system.error(`ログインできていません。`, req.user);
      res.status(STATUS_CODE_UNAUTHORIZED);
      next(new Error());
      return;
    }
    const user = parsed.data;
    if (user.type !== "Guest") {
      logger.system.error(`ゲストログインではありません。`, req.user);
      res.status(STATUS_CODE_UNAUTHORIZED);
      next(new Error());
      return;
    }
    next();
  },
  logLastLogin,
  (req, res) => {
    guestLoginRateLimiter.resetKey(req.ip);
    res.status(STATUS_CODE_SUCCESS).end();
  }
);

guestRouter.use(
  (
    err: Record<string, unknown>,
    _req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    // ログイン試行回数を超過した場合にはここは呼ばれない。
    if (
      typeof err.status === "number" &&
      err.status === STATUS_CODE_UNAUTHORIZED
    ) {
      res
        .status(STATUS_CODE_UNAUTHORIZED)
        .send({ error: ERROR_MESSAGE_GUEST_LOGIN_FAIL });
      return;
    }
    next(err);
  }
);

export { guestRouter };
