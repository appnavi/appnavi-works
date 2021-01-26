import path from "path";
import compression from "compression";
import cookieParser from "cookie-parser";
import cookieSession from "cookie-session";
import express from "express";
import helmet from "helmet";
import createError from "http-errors";
import sassMiddleware from "node-sass-middleware";
import { PassportStatic } from "passport";
import { passport } from "./config/passport";
import { getEnv } from "./helpers";
import * as logger from "./modules/logger";
import { authRouter } from "./routes/auth";
import { gamesRouter } from "./routes/games";
import { indexRouter } from "./routes/index";
import { uploadRouter } from "./routes/upload";
import { ensureAuthenticated } from "./services/auth";
import { URL_PREFIX_GAME } from "./services/upload";

const app = express();
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(compression());
// view engine setup
app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "ejs");
app.use(express.json());
app.use(
  cookieSession({
    name: "game-upload-dev",
    secret: getEnv("SESSION_SECRET"),
    maxAge: 1000 * 60 * 30,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  }),
  (passport as PassportStatic).initialize(),
  (passport as PassportStatic).session()
);
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  logger.connectLogger(logger.access, {
    level: "info",
  })
);
const PATH_PUBLIC_DIRECTORY = "../public";
app.use(
  sassMiddleware({
    src: path.join(__dirname, PATH_PUBLIC_DIRECTORY),
    dest: path.join(__dirname, PATH_PUBLIC_DIRECTORY),
    indentedSyntax: false, // true = .sass and false = .scss
    sourceMap: true,
  }),
  express.static(path.join(__dirname, PATH_PUBLIC_DIRECTORY))
);

const PATH_PRIVATE_DIRECTORY = "../private";
const URL_PREFIX_PRIVATE = "private";
app.use(
  `/${URL_PREFIX_PRIVATE}`,
  ensureAuthenticated,
  sassMiddleware({
    src: path.join(__dirname, PATH_PRIVATE_DIRECTORY),
    dest: path.join(__dirname, PATH_PRIVATE_DIRECTORY),
    indentedSyntax: false, // true = .sass and false = .scss
    sourceMap: true,
  }),
  express.static(path.join(__dirname, PATH_PRIVATE_DIRECTORY))
);

app.use("/", indexRouter);
app.use("/auth", authRouter);
app.use("/upload", uploadRouter);
app.use(`/${URL_PREFIX_GAME}`, gamesRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (
  err: NodeJS.Dict<unknown>,
  req: express.Request,
  res: express.Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: express.NextFunction //この引数を省略すると、views/error.ejsが描画されなくなる
) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.status = err.status;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  if (err.status !== 404) {
    logger.system.error("エラーが発生しました。", err);
  }

  // render the error page
  const status = typeof err.status === "number" ? err.status : 500;
  res.status(status);
  res.render("error");
});

module.exports = app;
