import express from "express";
import { WorkModel } from "../../models/database";
import {
  ensureAuthenticated,
  findOrCreateUser,
  getDefaultCreatorId,
  getUserIdOrThrow,
} from "../../services/auth";
import { URL_PREFIX_WORK } from "../../utils/constants";
import { render, wrap } from "../../utils/helpers";
import { guestRouter } from "./guest";

const accountRouter = express.Router();

accountRouter.use(ensureAuthenticated);

accountRouter.get(
  "/",
  wrap(async (req, res) => {
    const userId = getUserIdOrThrow(req);
    const defaultCreatorId = await getDefaultCreatorId(req);
    const works = await WorkModel.find({
      owner: userId,
    });
    const user = await findOrCreateUser(userId);
    render("account", req, res, {
      defaultCreatorId,
      works,
      urlPrefix: URL_PREFIX_WORK,
      creatorIds: user.creatorIds,
    });
  })
);
accountRouter.use("/guest", guestRouter);

export { accountRouter };
