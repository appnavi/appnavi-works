import express from "express";
import multer from "multer";
import { z } from "zod";
import { UserModel, WorkModel } from "../../models/database";
import {
  ensureAuthenticated,
  findOrCreateUser,
  getDefaultCreatorId,
  getUserIdOrThrow,
} from "../../services/auth";
import { csrf } from "../../services/csrf";
import { creatorIdSchema } from "../../services/works";
import {
  URL_PREFIX_WORK,
  STATUS_CODE_BAD_REQUEST,
  STATUS_CODE_SUCCESS,
} from "../../utils/constants";
import { render, wrap } from "../../utils/helpers";
import { backupRouter } from "./backup";
import { guestRouter } from "./guest";
import { workRouter } from "./work";

const accountRouter = express.Router();

accountRouter.use(ensureAuthenticated);

if (process.env.NODE_ENV !== "test") {
  accountRouter.use(csrf);
}

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
const defaultCreatorIdSchema = z.object({ default_creator_id: creatorIdSchema })
accountRouter.post(
  "/default-creator-id",
  multer().none(),
  wrap(async (req, res) => {
    const parsed = defaultCreatorIdSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(STATUS_CODE_BAD_REQUEST).send({
        errors: parsed.error.errors.map(x => x.message),
      });
      return;
    }
    await UserModel.updateOne(
      {
        userId: getUserIdOrThrow(req),
      },
      {
        $set: {
          defaultCreatorId: parsed.data.default_creator_id,
        },
      },
      { upsert: true }
    );
    res.status(STATUS_CODE_SUCCESS).end();
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
