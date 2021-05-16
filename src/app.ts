import path from "path";
import compression from "compression";
import cookieParser from "cookie-parser";
import cookieSession from "cookie-session";
import express from "express";
import helmet from "helmet";
import createError from "http-errors";
import sassMiddleware from "node-sass-middleware";
import passport from "passport";
import { preparePassport } from "./config/passport";
import * as logger from "./modules/logger";
import { authRouter } from "./routes/auth";
import { dbRouter } from "./routes/db";
import { gamesRouter } from "./routes/games";
import { indexRouter } from "./routes/index";
import { uploadRouter } from "./routes/upload";
import { ensureAuthenticated } from "./services/auth";
import {
  URL_PREFIX_PRIVATE,
  URL_PREFIX_GAME,
  DIRECTORY_NAME_PRIVATE,
  DIRECTORY_NAME_PUBLIC,
  DIRECTORY_NAME_VIEWS,
  STATUS_CODE_FAILURE,
} from "./utils/constants";
import { getEnv } from "./utils/helpers";

preparePassport(passport);

const app = express();
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(compression());
// view engine setup
app.set("views", path.join(__dirname, "..", DIRECTORY_NAME_VIEWS));
app.set("view engine", "ejs");
app.use(express.json());
app.use(
  cookieSession({
    name: getEnv("COOKIE_NAME"),
    keys: getEnv("COOKIE_KEYS").split(","),
    maxAge: 1000 * 60 * 30,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  }),
  passport.initialize(),
  passport.session()
);
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  logger.connectLogger(logger.access, {
    level: "info",
  })
);
const PATH_PUBLIC_DIRECTORY = path.join(__dirname, "..", DIRECTORY_NAME_PUBLIC);
app.use(
  sassMiddleware({
    src: PATH_PUBLIC_DIRECTORY,
    dest: PATH_PUBLIC_DIRECTORY,
    indentedSyntax: false, // true = .sass and false = .scss
    sourceMap: true,
  }),
  express.static(PATH_PUBLIC_DIRECTORY)
);

const PATH_PRIVATE_DIRECTORY = path.join(
  __dirname,
  "..",
  DIRECTORY_NAME_PRIVATE
);

app.use(
  URL_PREFIX_PRIVATE,
  ensureAuthenticated,
  sassMiddleware({
    src: PATH_PRIVATE_DIRECTORY,
    dest: PATH_PRIVATE_DIRECTORY,
    indentedSyntax: false, // true = .sass and false = .scss
    sourceMap: true,
  }),
  express.static(PATH_PRIVATE_DIRECTORY)
);

app.use("/", indexRouter);
app.use("/auth", authRouter);
app.use("/upload", uploadRouter);
app.use(URL_PREFIX_GAME, gamesRouter);
app.use("/db", dbRouter);

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
  const status =
    typeof err.status === "number" ? err.status : STATUS_CODE_FAILURE;
  res.status(status);
  res.render("error");
});

export { passport, app };
