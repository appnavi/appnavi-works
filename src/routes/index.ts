import express from "express";
import { getContentSecurityPolicy } from "../helpers";
import { ensureAuthenticated } from "../services/auth";

const router = express.Router();

router.get(
  "/",
  getContentSecurityPolicy(),
  ensureAuthenticated,
  function (req, res) {
    res.render("index");
  }
);

export { router };
