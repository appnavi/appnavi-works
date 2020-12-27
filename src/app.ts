import createError from "http-errors";
import express from "express";
import session from "express-session";
import path from "path";
import cookieParser from "cookie-parser";
import sassMiddleware from "node-sass-middleware";
import { router as indexRouter } from "./routes/index";
import { router as authRouter } from "./routes/auth";
import { router as uploadRouter } from "./routes/upload";

const logger = require("morgan");

const app = express();

// view engine setup
app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET ?? "",
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
  sassMiddleware({
    src: path.join(__dirname, "../public"),
    dest: path.join(__dirname, "../public"),
    indentedSyntax: false, // true = .sass and false = .scss
    sourceMap: true,
  })
);
app.use(express.static(path.join(__dirname, "../public")));
app.use("/games", express.static(path.join(__dirname, "../uploads")));

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
app.use(function (err: any, req: express.Request, res: express.Response, _:express.NextFunction) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.status = err.status;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
