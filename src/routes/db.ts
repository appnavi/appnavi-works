import express from "express";
import { WorkModel, UserModel } from "../models/database";
import { ensureAuthenticated } from "../services/auth";
import { render } from "../utils/helpers";

const dbRouter = express.Router();

dbRouter.use(ensureAuthenticated);
dbRouter.get("/works", function (req, res, next) {
  WorkModel.find()
    .then((works) => {
      render("db/works", req, res, {
        works: works,
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
