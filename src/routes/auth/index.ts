import express from "express";
import { isAuthenticated } from "../../services/auth";
import { UnauthorizedError } from "../../utils/errors";
import { render } from "../../utils/helpers";
import { guestRouter } from "./guest";
import { slackRouter } from "./slack";
const authRouter = express.Router();

authRouter.get("/error", (_req, _res, next) => {
  next(new UnauthorizedError());
});

authRouter.get("/logout", (req, res) => {
  req.logout(() => {
    req.session.destroy(() => {
      res.redirect("/auth");
    });
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
authRouter.use("/slack", slackRouter);
authRouter.use("/guest", guestRouter);
export { authRouter };
