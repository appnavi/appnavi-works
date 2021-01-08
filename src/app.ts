import createError from "http-errors";
import express from "express";
import session from "express-session";
import path from "path";
import cookieParser from "cookie-parser";
import sassMiddleware from "node-sass-middleware";
import serveIndex from "serve-index";
import { router as indexRouter } from "./routes/index";
import { router as authRouter } from "./routes/auth";
import {
  router as uploadRouter,
  DIRECTORY_UPLOADS_DESTINATION,
  URL_PREFIX_GAME,
} from "./routes/upload";
import * as logger from "./modules/logger";
import { getEnv } from "./helpers";
import dotenv from "dotenv";
import helmet from "helmet";

dotenv.config();
const app = express();
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": [
          "'self'",
          "https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js",
          "https://code.jquery.com/jquery-3.5.1.min.js",
        ],
        "img-src": [
          "'self'",
          "https://api.slack.com/img/sign_in_with_slack.png",
          "https://a.slack-edge.com/80588/img/sign_in_with_slack.png",
        ],
      },
    },
  })
);

// view engine setup
app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "ejs");
app.use(express.json());
app.use(
  session({
    secret: getEnv("SESSION_SECRET"),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, //TODO：https通信にする時はtrueにする。
      maxAge: 1000 * 60 * 30,
    },
  })
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
  })
);
app.use(express.static(path.join(__dirname, PATH_PUBLIC_DIRECTORY)));

app.use(
  `/${URL_PREFIX_GAME}`,
  express.static(path.join(__dirname, "..", DIRECTORY_UPLOADS_DESTINATION)),
  serveIndex(DIRECTORY_UPLOADS_DESTINATION, {
    icons: true,
  })
);

/*  ログインしている時のみtestsフォルダー内のファイルにアクセスできるように(参考：https://stackoverflow.com/a/30761936)
import {ensureAuthenticated} from './services/auth';
app.use('/test', ensureAuthenticated);
app.use('/test',express.static(path.join(__dirname, '../tests')));
*/

app.use("/", indexRouter);
app.use("/auth", authRouter);
app.use("/upload", uploadRouter);

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

  // render the error page
  const status = typeof err.status === "number" ? err.status : 500;
  res.status(status);
  res.render("error");
});

module.exports = app;
