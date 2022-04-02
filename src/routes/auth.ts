import express from "express";
import rateLimit from "express-rate-limit";
import createError from "http-errors";
import passport from "passport";
import * as logger from "../modules/logger";
import {
  findOrCreateUser,
  getUserIdOrThrow,
  isAuthenticated,
  redirect,
} from "../services/auth";
import {
  ERROR_MESSAGE_GUEST_LOGIN_EXCEED_RATE_LIMIT,
  ERROR_MESSAGE_GUEST_LOGIN_FAIL,
  STATUS_CODE_UNAUTHORIZED,
} from "../utils/constants";
import { render, wrap } from "../utils/helpers";

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
  req.logout();
  req.session.destroy(() => {
    res.redirect("/auth");
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

/*
TODO ストラテジー名"slack.com"をsrc\config\passport.tsのslackStrategy（createSlackStrategy()の戻り値）から動的に取得（Top-level awaitを使う必要あり）

問題点：現状tsconfigのmoduleが"ESNext"の時、ts-nodeが上手く動かない（moduleを"ESNext"にしないとTop-level awaitが使えない）
  対策1：ts-nodeの対応を待つ
  対策2：ts-nodeの試験的機能を有効にする（https://github.com/TypeStrong/ts-node/issues/1007）
  対策3：ts-node以外のライブラリを使う（tsc-watchなど）
*/
authRouter.get("/slack", passport.authenticate("slack.com"));
authRouter.get(
  "/slack/redirect",
  passport.authenticate("slack.com", {
    failureRedirect: "/auth/error",
  }),
  afterSlackLogin,
  wrap(logLastLogin),
  (req, res) => {
    redirect(req, res);
  }
);

async function logLastLogin(
  req: express.Request,
  _res: express.Response,
  next: express.NextFunction
): Promise<void> {
  const userDocument = await findOrCreateUser(getUserIdOrThrow(req));
  await userDocument.updateOne({
    $set: {
      lastLogIn: new Date(),
    },
  });
  next();
}

function afterGuestLogIn(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const user = req.user;
  if (user === undefined) {
    logger.system.error(`ログインできていません。`, req.user);
    res.redirect("/auth/error");
    return;
  }
  if (user.type !== "Guest") {
    logger.system.error(`ゲストログインではありません。`, req.user);
    res.redirect("/auth/error");
    return;
  }
  next();
}

function afterSlackLogin(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const user = req.user;
  if (user === undefined) {
    logger.system.error(`ログインできていません。`, req.user);
    res.redirect("/auth/error");
    return;
  }
  if (user.type !== "Slack") {
    logger.system.error(`Slackによるログインではありません。`, req.user);
    res.redirect("/auth/error");
    return;
  }
  logger.system.info(`ユーザー${user.id}がSlack認証でログインしました。`);
  next();
}

export { authRouter };
