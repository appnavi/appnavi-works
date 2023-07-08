import path from "path";
import compression from "compression";
import MongoStore from "connect-mongo";
import cookieParser from "cookie-parser";
import express from "express";
import session from "express-session";
import helmet from "helmet";
import passport from "passport";
import { URL_PREFIX_WORK } from "./common/constants";
import * as logger from "./modules/logger";
import { apiRouter } from "./routes/api";
import { worksRouter } from "./routes/works";
import { csrf } from "./services/csrf";
import {
  STATUS_CODE_SERVER_ERROR,
  STATUS_CODE_NOT_FOUND,
  DIRECTORY_NAME_DIST_CLIENT,
} from "./utils/constants";
import { env } from "./utils/env";
import { BadRequestError, HttpError, NotFoundError } from "./utils/errors";

const app = express();
app.use(
  helmet({
    // contentSecurityPolicy は 別の場所で設定
    contentSecurityPolicy: false,

    // crossOriginEmbedderPolicy はアバター画像が表示されなくなるので無効化
    // (有効にしつつアバター画像を表示するには Slack 側の対応が必要)
    crossOriginEmbedderPolicy: false,
  }),
);

app.use(compression());
app.use(express.json());
app.use(
  session({
    secret: env.COOKIE_SECRET,
    store:
      env.NODE_ENV !== "test"
        ? MongoStore.create({
            mongoUrl: env.SESSION_DATABASE_URL,
          })
        : undefined,
    cookie: {
      maxAge: 1000 * 60 * 30,
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
    },
    resave: false,
    saveUninitialized: false,
  }),
  passport.initialize(),
  passport.session(),
);
if (env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(env.COOKIE_SECRET));
app.use(
  logger.connectLogger(logger.access, {
    level: "info",
  }),
);

app.use(URL_PREFIX_WORK, worksRouter);

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "script-src": [
        "'self'",
        "https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js",
        "https://code.jquery.com/jquery-3.5.1.min.js",
      ],
      "img-src": ["*"],
    },
  }),
);

if (env.NODE_ENV !== "test") {
  app.use(csrf);
}

app.use("/api", apiRouter);

if (env.NODE_ENV === "production") {
  app.use(express.static(path.resolve(DIRECTORY_NAME_DIST_CLIENT)));
}
app.use(function (_req, res, next) {
  if (env.NODE_ENV !== "production") {
    // catch 404 and forward to error handler
    next(new NotFoundError());
  } else {
    res.sendFile(path.resolve(DIRECTORY_NAME_DIST_CLIENT, "index.html"));
  }
});

// error handler
app.use(function (
  err: Record<string, unknown>,
  _req: express.Request,
  res: express.Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: express.NextFunction, //この引数を省略すると、このerror handler が実行されなくなる
) {
  const isDev = env.NODE_ENV === "development";
  if (!(err instanceof HttpError)) {
    res.status(STATUS_CODE_SERVER_ERROR).json({
      status: STATUS_CODE_SERVER_ERROR,
      message: "サーバーでエラーが発生しました。",
      error: isDev ? err : {},
    });
    return;
  }

  const status =
    typeof err.status === "number" ? err.status : STATUS_CODE_SERVER_ERROR;
  if (status !== STATUS_CODE_NOT_FOUND) {
    logger.system.error("エラーが発生しました。", err);
  }

  if (err instanceof BadRequestError) {
    res.status(status).json({
      errors: err.errors,
    });
    return;
  }
  res.status(status).json({
    status: err.status,
    message: err.responseMessage,
    error: isDev ? err : {},
  });
});
export { app };
