import express from "express";
import passport from "passport";
import { User } from "../../../common/types";
import { STRATEGY_NAME_TEST } from "../../../config/passport";
import { findOrCreateUser } from "../../../services/auth";
import { env } from "../../../utils/env";
import { UnauthorizedError } from "../../../utils/errors";
import { wrap } from "../../../utils/helpers";
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

authRouter.use("/slack", slackRouter);
authRouter.use("/guest", guestRouter);

if (env.NODE_ENV === "test") {
  authRouter.post(
    "/test",
    passport.authenticate(STRATEGY_NAME_TEST),
    wrap(async (req, _res, next) => {
      const parsed = User.safeParse(req.user);
      if (!parsed.success) {
        next(new Error("テスト用ログインに失敗しました。"));
        return;
      }
      const user = parsed.data;
      const userDocument = await findOrCreateUser(user.id);
      if (user.type === "Guest") {
        await userDocument.updateOne({
          $set: {
            guest: {
              hashedPassword: "",
              createdBy: "",
            },
          },
        });
      }
      next();
    }),
    (_req, res) => {
      res.redirect("/");
    },
  );
}

export { authRouter };
