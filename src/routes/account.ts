import express from "express";
import multer from "multer";
import * as yup from "yup";
import { UserModel, WorkModel } from "../models/database";
import { ensureAuthenticated, getDefaultCreatorId } from "../services/auth";
import {
  creatorIdSchema,
  findOrCreateWork,
  restoreBackup,
  workIdSchema,
} from "../services/works";
import {
  URL_PREFIX_WORK,
  STATUS_CODE_BAD_REQUEST,
  STATUS_CODE_SUCCESS,
  MESSAGE_BACKUP_NAME_REQUIRED,
  MESSAGE_BACKUP_NAME_INVALID,
} from "../utils/constants";
import { getContentSecurityPolicy, render, wrap } from "../utils/helpers";

const accountRouter = express.Router();
accountRouter.use(getContentSecurityPolicy());

accountRouter.use(ensureAuthenticated);

accountRouter.get(
  "/",
  wrap(async (req, res) => {
    const defaultCreatorId = await getDefaultCreatorId(req);
    const works = await WorkModel.find({
      owner: req.user?.user.id,
    });
    render("account", req, res, {
      defaultCreatorId,
      works,
      urlPrefix: URL_PREFIX_WORK,
    });
  })
);
accountRouter.post(
  "/default-creator-id",
  multer().none(),
  wrap(async (req, res) => {
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
    res.send(STATUS_CODE_SUCCESS).end();
  })
);
const backupNameSchema = yup
  .string()
  .matches(/^\d+$/, MESSAGE_BACKUP_NAME_INVALID)
  .required(MESSAGE_BACKUP_NAME_REQUIRED);
const restoreBackupSchema = yup.object({
  creatorId: creatorIdSchema,
  workId: workIdSchema,
  backupName: backupNameSchema,
});
accountRouter.post(
  "/restore-work-backup",
  multer().none(),
  wrap(async (req, res) => {
    const params = req.body as {
      creatorId: string;
      workId: string;
      backupName: string;
    };
    try {
      await restoreBackupSchema.validate(params);
    } catch (e) {
      const err = e as { name: string; errors: string[] };
      res.status(STATUS_CODE_BAD_REQUEST).send({
        errors: err.errors,
      });
      return;
    }
    const { creatorId, workId, backupName } = params;
    const work = await findOrCreateWork(creatorId, workId, req.user?.id ?? "");
    await restoreBackup(creatorId, workId, work, backupName);
    res.status(STATUS_CODE_SUCCESS).end();
  })
);
export { accountRouter };
