import express from "express";
import { GameModel, UserModel } from "../models/database";
import { ensureAuthenticated } from "../services/auth";
import { getContentSecurityPolicy, render } from "../utils/helpers";

const dbRouter = express.Router();

dbRouter.use(ensureAuthenticated, getContentSecurityPolicy());
dbRouter.get("/games", function (req, res, next) {
  GameModel.find((err, data) => {
    if (err) {
      next(err);
      return;
    }
    render("db/games", req, res, {
      games: data,
    });
  });
});
dbRouter.get("/users", function (req, res, next) {
  UserModel.find((err, data) => {
    if (err) {
      next(err);
      return;
    }
    console.log(data);
    render("db/users", req, res, {
      users: data,
    });
  });
});

export { dbRouter };
