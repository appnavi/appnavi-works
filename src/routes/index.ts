import express from "express";
import { ensureAuthenticated } from "../services/auth";

const router = express.Router();

router.get("/", ensureAuthenticated, function (req, res, next) {
  res.render("index");
});

module.exports = router;
