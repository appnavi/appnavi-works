import express from "express";
import multer from "multer";
import * as yup from "yup";
import { UserModel, WorkModel } from "../models/database";
import {
  ensureAuthenticated,
  getDefaultCreatorId,
  getUserIdOrThrow,
} from "../services/auth";
import {
  creatorIdSchema,
  deleteBackup,
  deleteWork,
  renameWork,
  restoreBackup,
  workIdSchema,
} from "../services/works";
import {
  URL_PREFIX_WORK,
  STATUS_CODE_BAD_REQUEST,
  STATUS_CODE_SUCCESS,
  ERROR_MESSAGE_BACKUP_NAME_REQUIRED,
  ERROR_MESSAGE_BACKUP_NAME_INVALID,
} from "../utils/constants";
import {
  BadRequestError,
  DeleteWorkError,
  RenameWorkError,
} from "../utils/errors";
import { render, wrap } from "../utils/helpers";

const accountRouter = express.Router();

accountRouter.use(ensureAuthenticated);

accountRouter.get(
  "/",
  wrap(async (req, res) => {
    const defaultCreatorId = await getDefaultCreatorId(req);
    const works = await WorkModel.find({
      owner: getUserIdOrThrow(req),
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
        userId: getUserIdOrThrow(req),
      },
      {
        $set: {
          defaultCreatorId: defaultCreatorId,
        },
      },
      { upsert: true }
    );
    res.status(STATUS_CODE_SUCCESS).end();
  })
);
const backupNameSchema = yup
  .string()
  .matches(/^\d+$/, ERROR_MESSAGE_BACKUP_NAME_INVALID)
  .required(ERROR_MESSAGE_BACKUP_NAME_REQUIRED);
const backupSchema = yup.object({
  creatorId: creatorIdSchema,
  workId: workIdSchema,
  backupName: backupNameSchema,
});
accountRouter.post(
  "/backup/restore",
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
accountRouter.post(
  "/backup/delete",
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
const renameWorkSchema = yup.object({
  creatorId: creatorIdSchema,
  workId: workIdSchema,
  renamedCreatorId: creatorIdSchema,
  renamedWorkId: workIdSchema,
});
accountRouter.post(
  "/work/rename",
  multer().none(),
  wrap(async (req, res) => {
    const params = req.body as {
      creatorId: string;
      workId: string;
      renamedCreatorId: string;
      renamedWorkId: string;
    };
    try {
      await renameWorkSchema.validate(params);
    } catch (e) {
      const err = e as { name: string; errors: string[] };
      throw new RenameWorkError(err.errors, params);
    }
    const { creatorId, workId, renamedCreatorId, renamedWorkId } = params;
    try {
      await renameWork(
        creatorId,
        workId,
        getUserIdOrThrow(req),
        renamedCreatorId,
        renamedWorkId
      );
    } catch (err) {
      if (err instanceof BadRequestError) {
        throw new RenameWorkError([err.message], params);
      }
    }
    res.status(STATUS_CODE_SUCCESS).end();
  })
);
const deleteWorkSchema = yup.object({
  creatorId: creatorIdSchema,
  workId: workIdSchema,
});
accountRouter.post(
  "/work/delete",
  multer().none(),
  wrap(async (req, res) => {
    const params = req.body as {
      creatorId: string;
      workId: string;
    };
    try {
      await deleteWorkSchema.validate(params);
    } catch (e) {
      const err = e as { name: string; errors: string[] };
      throw new DeleteWorkError(err.errors, params);
    }
    const { creatorId, workId } = params;
    try {
      await deleteWork(creatorId, workId, getUserIdOrThrow(req));
    } catch (err) {
      if (err instanceof BadRequestError) {
        throw new DeleteWorkError([err.message], params);
      }
    }
    res.status(STATUS_CODE_SUCCESS).end();
  })
);
export { accountRouter };
