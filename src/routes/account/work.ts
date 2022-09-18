import express from "express";
import multer from "multer";
import * as yup from "yup";
import { getUserIdOrThrow } from "../../services/auth";
import {
  creatorIdSchema,
  deleteWork,
  renameWork,
  workIdSchema,
} from "../../services/works";
import { STATUS_CODE_SUCCESS } from "../../utils/constants";
import {
  BadRequestError,
  DeleteWorkError,
  RenameWorkError,
} from "../../utils/errors";
import { wrap } from "../../utils/helpers";
const workRouter = express.Router();
const renameWorkSchema = yup.object({
  creatorId: creatorIdSchema,
  workId: workIdSchema,
  renamedCreatorId: creatorIdSchema,
  renamedWorkId: workIdSchema,
});
workRouter.post(
  "/rename",
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
workRouter.post(
  "/delete",
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
export { workRouter };
