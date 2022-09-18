import express from "express";
import multer from "multer";
import * as yup from "yup";
import { getUserIdOrThrow } from "../../services/auth";
import {
  creatorIdSchema,
  deleteBackup,
  restoreBackup,
  workIdSchema,
} from "../../services/works";
import {
  STATUS_CODE_BAD_REQUEST,
  STATUS_CODE_SUCCESS,
  ERROR_MESSAGE_BACKUP_NAME_REQUIRED,
  ERROR_MESSAGE_BACKUP_NAME_INVALID,
} from "../../utils/constants";
import { wrap } from "../../utils/helpers";

const backupRouter = express.Router();

const backupNameSchema = yup
  .string()
  .matches(/^\d+$/, ERROR_MESSAGE_BACKUP_NAME_INVALID)
  .required(ERROR_MESSAGE_BACKUP_NAME_REQUIRED);
const backupSchema = yup.object({
  creatorId: creatorIdSchema,
  workId: workIdSchema,
  backupName: backupNameSchema,
});
backupRouter.post(
  "/restore",
  multer().none(),
  wrap(async (req, res) => {
    const params = req.body as {
      creatorId: string;
      workId: string;
      backupName: string;
    };
    try {
      await backupSchema.validate(params);
    } catch (e) {
      const err = e as { name: string; errors: string[] };
      res.status(STATUS_CODE_BAD_REQUEST).send({
        errors: err.errors,
      });
      return;
    }
    const { creatorId, workId, backupName } = params;
    await restoreBackup(creatorId, workId, getUserIdOrThrow(req), backupName);
    res.status(STATUS_CODE_SUCCESS).end();
  })
);
backupRouter.post(
  "/delete",
  multer().none(),
  wrap(async (req, res) => {
    const params = req.body as {
      creatorId: string;
      workId: string;
      backupName: string;
    };
    try {
      await backupSchema.validate(params);
    } catch (e) {
      const err = e as { name: string; errors: string[] };
      res.status(STATUS_CODE_BAD_REQUEST).send({
        errors: err.errors,
      });
      return;
    }
    const { creatorId, workId, backupName } = params;
    await deleteBackup(creatorId, workId, getUserIdOrThrow(req), backupName);
    res.status(STATUS_CODE_SUCCESS).end();
  })
);
export { backupRouter };
