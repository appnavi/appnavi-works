import bcrypt from "bcrypt";
import express from "express";
import createError from "http-errors";
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
import { generateRandomString, render, wrap } from "../utils/helpers";

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

accountRouter.use("/guest", (req, _res, next) => {
  const userType = req.user?.type;
  if (userType !== "Slack") {
    next(createError(404));
  }
  next();
});
accountRouter.get(
  "/guest",
  wrap(async (req, res) => {
    const userId = getUserIdOrThrow(req);
    const guests = await UserModel.find({
      "guest.createdBy": {
        $eq: userId,
      },
    });
    render("account/guest", req, res, { guests });
  })
);
accountRouter.post(
  "/guest/create",
  wrap(async (req, res) => {
    let guestUserId: string | undefined;
    for (;;) {
      guestUserId = `guest-${generateRandomString(6)}`;
      const users = await UserModel.find({ userId: guestUserId });
      if (users.length == 0) {
        break;
      }
    }
    const password = generateRandomString(16);
    const hashedPassword = await bcrypt.hash(password, 10);
    await UserModel.create({
      userId: guestUserId,
      guest: {
        hashedPassword,
        createdBy: req.user?.id,
      },
    });
    render("account/guest/create", req, res, {
      guestUserId,
      password,
    });
  })
);
const deleteGuestSchema = yup.object({
  guestId: yup.string().required(),
});
accountRouter.post(
  "/guest/delete",
  multer().none(),
  wrap(async (req, res) => {
    const params = req.body as {
      guestId: string;
    };
    try {
      await deleteGuestSchema.validate(params);
    } catch (e) {
      const err = e as { name: string; errors: string[] };
      throw new BadRequestError(
        "ゲストユーザー削除に失敗しました。",
        err.errors,
        params
      );
    }

    const guestUsers = await UserModel.find({ userId: params.guestId });
    if (guestUsers.length !== 1) {
      throw new BadRequestError(
        "ゲストユーザー削除に失敗しました。",
        ["ゲストユーザーの数が不適切です", guestUsers.length],
        params
      );
    }
    const guestUser = guestUsers[0];
    if (guestUser.guest === undefined) {
      throw new BadRequestError(
        "ゲストユーザー削除に失敗しました。",
        ["ゲストユーザーではありません。"],
        params
      );
    }
    const worksByGuest = await WorkModel.find({
      owner: guestUser.userId,
    });
    if (worksByGuest.length !== 0) {
      throw new BadRequestError(
        "ゲストユーザー削除に失敗しました。",
        ["このゲストユーザーが投稿した作品が存在します。"],
        params
      );
    }
    await guestUser.delete();
    res.status(200).end();
  })
);
export { accountRouter };
