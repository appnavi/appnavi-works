import express from "express";
import { WorkModel, UserModel } from "../models/database";
import { ensureAuthenticated } from "../services/auth";
import { URL_PREFIX_WORK } from "../utils/constants";
import { render, wrap } from "../utils/helpers";

const dbRouter = express.Router();

dbRouter.use(ensureAuthenticated);
dbRouter.get(
  "/works",
  wrap(async (req, res) => {
    const works = await WorkModel.find();
    render("db/works", req, res, {
      urlPrefix: URL_PREFIX_WORK,
      works: works,
    });
  })
);
dbRouter.get(
  "/works/raw",
  wrap(async (req, res) => {
    const works = await WorkModel.find();
    render("db/works/raw", req, res, {
      works: works,
    });
  })
);
dbRouter.get(
  "/users",
  wrap(async (req, res) => {
    const users = await UserModel.find();
    const userWithWorks = await Promise.all(
      users.map(async (user) => {
        const works = await WorkModel.find({ owner: user.userId });
        return {
          ...user.toObject(),
          works,
        };
      })
    );
    console.log(userWithWorks);
    render("db/users", req, res, {
      urlPrefix: URL_PREFIX_WORK,
      users: userWithWorks,
    });
  })
);
dbRouter.get(
  "/users/raw",
  wrap(async (req, res) => {
    const users = await UserModel.find();
    render("db/users/raw", req, res, {
      users: users,
    });
  })
);

export { dbRouter };
