import express from "express";
import multer from "multer";
import { z } from "zod";
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

const backupNameSchema = z
  .string({ required_error: ERROR_MESSAGE_BACKUP_NAME_REQUIRED })
  .regex(/^\d+$/, ERROR_MESSAGE_BACKUP_NAME_INVALID);

const backupSchema = z.object({
  creatorId: creatorIdSchema,
  workId: workIdSchema,
  backupName: backupNameSchema,
});
backupRouter.post(
  "/restore",
  multer().none(),
  wrap(async (req, res) => {
    const parsed = backupSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(STATUS_CODE_BAD_REQUEST).send({
        errors: parsed.error.errors.map((x) => x.message),
      });
      return;
    }
    const { creatorId, workId, backupName } = parsed.data;
    await restoreBackup(creatorId, workId, getUserIdOrThrow(req), backupName);
    res.status(STATUS_CODE_SUCCESS).end();
  })
);
backupRouter.post(
  "/delete",
  multer().none(),
  wrap(async (req, res) => {
    const parsed = backupSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(STATUS_CODE_BAD_REQUEST).send({
        errors: parsed.error.errors.map((x) => x.message),
      });
      return;
    }
    const { creatorId, workId, backupName } = parsed.data;
    await deleteBackup(creatorId, workId, getUserIdOrThrow(req), backupName);
    res.status(STATUS_CODE_SUCCESS).end();
  })
);
export { backupRouter };
