import express from "express";
import passport from "passport";
import { afterSlackLogin, logLastLogin, redirect } from "../../services/auth";
import { wrap } from "../../utils/helpers";

/*
TODO ストラテジー名"slack.com"をsrc\config\passport.tsのslackStrategy（createSlackStrategy()の戻り値）から動的に取得(slackStrategy.nameで取得できる)（Top-level awaitを使う必要あり）

問題点：現状tsconfigのmoduleが"ESNext"の時、ts-nodeが上手く動かない（moduleを"ESNext"にしないとTop-level awaitが使えない）
  対策1：ts-nodeの対応を待つ
  対策2：ts-nodeの試験的機能を有効にする（https://github.com/TypeStrong/ts-node/issues/1007）
  対策3：ts-node以外のライブラリを使う（tsc-watchなど）
*/
const slackRouter = express.Router();
slackRouter.get("/", passport.authenticate("slack.com"));
slackRouter.get(
  "/redirect",
  passport.authenticate("slack.com", {
    failureRedirect: "/auth/error",
  }),
  afterSlackLogin,
  wrap(logLastLogin),
  (req, res) => {
    redirect(req, res);
  }
);
export { slackRouter };
