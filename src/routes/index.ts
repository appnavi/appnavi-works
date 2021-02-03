import express from "express";
import { ensureAuthenticated } from "../services/auth";
import { getContentSecurityPolicy } from "../utils/helpers";

const indexRouter = express.Router();

//NOTE：indexRouterで登録するpathは"/"のみ
//NOTE：indexRouter.use()は使わないように(全URLに対して発火してしまう)
indexRouter.get(
  "/",
  getContentSecurityPolicy(),
  ensureAuthenticated,
  function (req, res) {
    res.render("index");
  }
);

export { indexRouter };
