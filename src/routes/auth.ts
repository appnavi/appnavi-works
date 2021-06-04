import express from "express";
import createError from "http-errors";
import { passport } from "../app";
import * as logger from "../modules/logger";
import { findOrCreateUser, isAuthenticated, redirect } from "../services/auth";
import { STATUS_CODE_UNAUTHORIZED } from "../utils/constants";
import { getEnv, render, wrap, isSlackUser } from "../utils/helpers";

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
authRouter
  .route("/guest")
  .get((req, res) => {
    if (isAuthenticated(req)) {
      res.redirect("/");
      return;
    }
    render("auth/guest", req, res);
  })
  .post(passport.authenticate("local", { failWithError: true }), (req, res) => {
    redirect(req, res);
  });

authRouter.use(
  "/guest",
  (
    err: NodeJS.Dict<unknown>,
    req: express.Request,
    res: express.Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: express.NextFunction //この引数を省略すると、views/error.ejsが描画されなくなる
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

function afterSlackLogin(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const user = req.user;
  if (!isSlackUser(user)) {
    logger.system.error(`Slackによるログインではありません。`, req.user);
    res.redirect("/auth/error");
    return;
  }
  const workspaceId = user.team.id;
  if (workspaceId !== getEnv("SLACK_WORKSPACE_ID")) {
    logger.system.error(
      `違うワークスペース${workspaceId}の人がログインしようとしました。`,
      req.user
    );
    res.redirect("/auth/error");
    return;
  }
  logger.system.info(`ユーザー${user.id}がSlack認証でログインしました。`);
  next();
}

export { authRouter };
