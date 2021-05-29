import express from "express";
import { WorkModel, UserModel } from "../models/database";
import { ensureAuthenticated } from "../services/auth";
import { render } from "../utils/helpers";

const dbRouter = express.Router();

dbRouter.use(ensureAuthenticated);

dbRouter.get("/works/raw", function (req, res, next) {
  WorkModel.find()
    .then((works) => {
      render("db/works/raw", req, res, {
        works: works,
      });
    })
    .catch((err) => {
      next(err);
    });
});

dbRouter.get("/users/raw", function (req, res, next) {
  UserModel.find()
    .then((users) => {
      render("db/users/raw", req, res, {
        users: users,
      });
    })
    .catch((err) => {
      next(err);
    });
});

export { dbRouter };
