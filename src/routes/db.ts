import express from "express";
import { GameModel, UserModel } from "../models/database";
import { ensureAuthenticated } from "../services/auth";
import { getContentSecurityPolicy, render } from "../utils/helpers";

const dbRouter = express.Router();

dbRouter.use(ensureAuthenticated, getContentSecurityPolicy());
dbRouter.get("/games", function (req, res, next) {
  GameModel.find()
    .then((games) => {
      render("db/games", req, res, {
        games: games,
      });
    })
    .catch((err) => {
      next(err);
    });
});
dbRouter.get("/users", function (req, res, next) {
  UserModel.find()
    .then((users) => {
      render("db/users", req, res, {
        users: users,
      });
    })
    .catch((err) => {
      next(err);
    });
});

export { dbRouter };
