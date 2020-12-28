import express from "express";
import { ensureAuthenticated } from "../services/auth";

const router = express.Router();

router.get("/", ensureAuthenticated, function (req, res) {
  res.render("index");
});

export { router };
