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
import { backupRouter } from "./backup";
import { guestRouter } from "./guest";
import { workRouter } from "./work";

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
accountRouter.use("/backup", backupRouter);
accountRouter.use("/work", workRouter);
accountRouter.use("/guest", guestRouter);

accountRouter.post(
  "/cleanup-creator-ids",
  wrap(async (req, res) => {
    const user = await findOrCreateUser(getUserIdOrThrow(req));
    const works = await WorkModel.find();
    const usedCreatorIds = user.creatorIds.filter((id) => {
      return works.find((w) => w.creatorId === id) !== undefined;
    });
    await user.update({
      creatorIds: usedCreatorIds,
    });
    res.status(200).end();
  })
);
export { accountRouter };
