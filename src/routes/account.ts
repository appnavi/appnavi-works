import express from "express";
import multer from "multer";
import { UserModel } from "../models/database";
import { ensureAuthenticated, getDefaultCreatorId } from "../services/auth";
import { creatorIdSchema } from "../services/games";
import { STATUS_CODE_BAD_REQUEST } from "../utils/constants";
import { getContentSecurityPolicy, render } from "../utils/helpers";

const accountRouter = express.Router();
accountRouter.use(getContentSecurityPolicy());

accountRouter.use(ensureAuthenticated);

accountRouter.get("/", (req, res, next) => {
  getDefaultCreatorId(req)
    .then((defaultCreatorId) => {
      render("account", req, res, {
        defaultCreatorId: defaultCreatorId,
      });
    })
    .catch((err) => {
      next(err);
    });
});
accountRouter.post("/default-creator-id", multer().none(), async (req, res) => {
  const defaultCreatorId = (req.body as Record<string, unknown>)[
    "default_creator_id"
  ] as string;
  try {
    await creatorIdSchema.validate(defaultCreatorId);
  } catch (e) {
    const err = e as { name: string; errors: string[] };
    res.status(STATUS_CODE_BAD_REQUEST).send({
      errors: err.errors,
    });
    return;
  }
  await UserModel.updateOne(
    {
      userId: req.user?.user.id,
    },
    {
      $set: {
        defaultCreatorId: defaultCreatorId,
      },
    },
    { upsert: true }
  );
  res.send(200).end();
});

export { accountRouter };
