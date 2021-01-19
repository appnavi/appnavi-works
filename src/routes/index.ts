import express from "express";
import { getContentSecurityPolicy } from "../helpers";
import { ensureAuthenticatedWithRedirect } from "../services/auth";

const indexRouter = express.Router();

//NOTE：indexRouterで登録するpathは"/"のみ
//NOTE：indexRouter.use()は使わないように(全URLに対して発火してしまう)
indexRouter.get(
  "/",
  getContentSecurityPolicy(),
  ensureAuthenticatedWithRedirect,
  function (req, res) {
    res.render("index");
  }
);

export { indexRouter };
