import express from "express";
import { getContentSecurityPolicy } from "../helpers";
import { ensureAuthenticated } from "../services/auth";

const indexRouter = express.Router();

indexRouter.get(
  "/",
  getContentSecurityPolicy(),
  ensureAuthenticated,
  function (req, res) {
    res.render("index");
  }
);

export { indexRouter };
