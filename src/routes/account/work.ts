import express from "express";
import multer from "multer";
import { z } from "zod";
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
const renameWorkSchema = z.object({
  creatorId: creatorIdSchema,
  workId: workIdSchema,
  renamedCreatorId: creatorIdSchema,
  renamedWorkId: workIdSchema,
});
workRouter.post(
  "/rename",
  multer().none(),
  wrap(async (req, res) => {
    const body = req.body;
    const parsed = renameWorkSchema.safeParse(body);
    if (!parsed.success) {
      throw new RenameWorkError(parsed.error.errors.map(x => x.message), body);
    }
    const { creatorId, workId, renamedCreatorId, renamedWorkId } = parsed.data;
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
        throw new RenameWorkError([err.message], body);
      }
    }
    res.status(STATUS_CODE_SUCCESS).end();
  })
);
const deleteWorkSchema = z.object({
  creatorId: creatorIdSchema,
  workId: workIdSchema,
});
workRouter.post(
  "/delete",
  multer().none(),
  wrap(async (req, res) => {
    const body = req.body
    const parsed = deleteWorkSchema.safeParse(body);
    if (!parsed.success) {
      throw new DeleteWorkError(parsed.error.errors.map(x => x.message), body);
    }
    const { creatorId, workId } = parsed.data;
    try {
      await deleteWork(creatorId, workId, getUserIdOrThrow(req));
    } catch (err) {
      if (err instanceof BadRequestError) {
        throw new DeleteWorkError([err.message], body);
      }
    }
    res.status(STATUS_CODE_SUCCESS).end();
  })
);
export { workRouter };
