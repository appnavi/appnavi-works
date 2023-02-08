import path from "path";
import compression from "compression";
import MongoStore from "connect-mongo";
import cookieParser from "cookie-parser";
import express from "express";
import session from "express-session";
import helmet from "helmet";
import createError from "http-errors";
import passport from "passport";
import * as logger from "./modules/logger";
import { accountRouter } from "./routes/account";
import { authRouter } from "./routes/auth";
import { dbRouter } from "./routes/db";
import { indexRouter } from "./routes/index";
import { uploadRouter } from "./routes/upload";
import { worksRouter } from "./routes/works";
import { ensureAuthenticated } from "./services/auth";
import {
  URL_PREFIX_PRIVATE,
  URL_PREFIX_WORK,
  DIRECTORY_NAME_PRIVATE,
  DIRECTORY_NAME_PUBLIC,
  DIRECTORY_NAME_VIEWS,
  STATUS_CODE_SERVER_ERROR,
} from "./utils/constants";
import { env } from "./utils/env";
import { BadRequestError } from "./utils/errors";
import { ejsToHtml, ignoreTypescriptFile, render } from "./utils/helpers";

export function createApp() {
  const app = express();
  app.use(
    helmet({
      // contentSecurityPolicy は 別の場所で設定
      contentSecurityPolicy: false,

      // crossOriginEmbedderPolicy はアバター画像が表示されなくなるので無効化
      // (有効にしつつアバター画像を表示するには Slack 側の対応が必要)
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(compression());
  // view engine setup
  app.set("views", path.resolve(DIRECTORY_NAME_VIEWS));
  app.engine("ejs", function (filePath, options, callback) {
    ejsToHtml(filePath, options as Record<string, unknown>)
      .then((it) => callback(null, it))
      .catch((err) => callback(err));
  });
  app.set("view engine", "ejs");

  app.use(express.json());
  app.use(
    session({
      secret: env.COOKIE_SECRET,
      store: MongoStore.create({
        mongoUrl: env.SESSION_DATABASE_URL,
      }),
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
    passport.session()
  );
  if (env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser(env.COOKIE_SECRET));
  app.use(
    logger.connectLogger(logger.access, {
      level: "info",
    })
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
    })
  );

  app.use(
    ignoreTypescriptFile,
    express.static(path.resolve(DIRECTORY_NAME_PUBLIC))
  );
  app.use(
    URL_PREFIX_PRIVATE,
    ensureAuthenticated,
    express.static(path.resolve(DIRECTORY_NAME_PRIVATE))
  );

  app.use("/", indexRouter);
  app.use("/auth", authRouter);
  app.use("/account", accountRouter);
  app.use("/upload", uploadRouter);
  app.use("/db", dbRouter);

  // catch 404 and forward to error handler
  app.use(function (_req, _res, next) {
    next(createError(404));
  });

  // error handler
  app.use(function (
    err: Record<string, unknown>,
    req: express.Request,
    res: express.Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: express.NextFunction //この引数を省略すると、views/error.ejsが描画されなくなる
  ) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.status = err.status;
    res.locals.error = req.app.get("env") === "development" ? err : {};
    const status =
      typeof err.status === "number" ? err.status : STATUS_CODE_SERVER_ERROR;
    if (status !== 404) {
      logger.system.error("エラーが発生しました。", err);
    }

    // render the error page
    res.status(status);
    if (err instanceof BadRequestError) {
      res.json({
        errors: err.errors,
      });
    } else {
      render("error", req, res);
    }
  });
  return app;
}
