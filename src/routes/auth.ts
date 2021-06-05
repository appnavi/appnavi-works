import bcrypt from "bcrypt";
import express from "express";
import createError from "http-errors";
import { passport } from "../app";
import { UserModel } from "../models/database";
import * as logger from "../modules/logger";
import {
  findOrCreateUser,
  generateRandomString,
  isAuthenticated,
  redirect,
} from "../services/auth";
import { STATUS_CODE_UNAUTHORIZED } from "../utils/constants";
import { render, wrap } from "../utils/helpers";

const authRouter = express.Router();

authRouter.get("/error", (_req, _res, next) => {
  next(createError(STATUS_CODE_UNAUTHORIZED));
});

authRouter.get("/", function (req, res) {
  if (isAuthenticated(req)) {
    res.redirect("/");
    return;
  }
  render("auth", req, res);
});
// TODO：ゲストユーザーを作成するルート作成(ゲストユーザーがアクセスした際は404を返す)
authRouter
  .route("/guest")
  .get((req, res) => {
    if (isAuthenticated(req)) {
      res.redirect("/");
      return;
    }
    render("auth/guest", req, res);
  })
  .post(
    passport.authenticate("local", { failWithError: true }),
    afterGuestLogIn,
    logLastLogin,
    (req, res) => {
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
    if (
      typeof err.status === "number" &&
      err.status === STATUS_CODE_UNAUTHORIZED
    ) {
      render("auth/guest", req, res, {
        error: "ユーザーIDまたはパスワードが違います。",
      });
      return;
    }
    next(err);
  }
);

authRouter
  .use("/guest/create", (req, res, next) => {
    const userType = req.user?.type;
    if (userType !== "Slack") {
      next(createError(404));
    }
    next();
  })
  .get("/guest/create", (req, res) => {
    render("auth/guest/create", req, res);
  })
  .post(
    "/guest/create",
    wrap(async (req, res) => {
      let guestUserId: string | undefined;
      for (;;) {
        guestUserId = `guest-${generateRandomString(6)}`;
        const users = await UserModel.find({ userId: guestUserId });
        if (users.length == 0) {
          break;
        }
      }
      const password = generateRandomString(16);
      const hashedPassword = await bcrypt.hash(password, 10);
      await UserModel.create({
        userId: guestUserId,
        hashedPassword,
      });
      render("auth/guest/create", req, res, {
        guestUserId,
        password,
      });
    })
  );

authRouter.get("/slack", passport.authenticate("slack"));
authRouter.get(
  "/redirect",
  passport.authenticate("slack", {
    failureRedirect: "/auth/error",
  }),
  afterSlackLogin,
  wrap(logLastLogin),
  (req, res) => {
    redirect(req, res);
  }
);

authRouter.all("/logout", (req, res) => {
  req.session = undefined;
  res.redirect("/auth");
});

async function logLastLogin(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<void> {
  const userDocument = await findOrCreateUser(req);
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
