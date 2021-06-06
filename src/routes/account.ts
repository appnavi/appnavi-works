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
  ERROR_MESSAGE_GUEST_NOT_FOUND,
  ERROR_MESSAGE_MULTIPLE_GUESTS_FOUND,
  ERROR_MESSAGE_NOT_GUEST_USER,
  ERROR_MESSAGE_GUEST_WORKS_NOT_EMPTY,
  ERROR_MESSAGE_GUEST_DIFFERENT_CREATOR,
  ERROR_MESSAGE_GUEST_ID_INVALID,
  ERROR_MESSAGE_GUEST_ID_REQUIRED,
} from "../utils/constants";
import {
  BadRequestError,
  DeleteGuestUserError,
  DeleteWorkError,
  RenameWorkError,
} from "../utils/errors";
import {
  generateRandomString,
  randomStringCharacters,
  render,
  wrap,
} from "../utils/helpers";

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

// TODO:ゲストユーザー関連の単体テスト作成
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
const guestIdRegex = new RegExp(`^[-${randomStringCharacters as string}]+$`);
const deleteGuestSchema = yup.object({
  guestId: yup
    .string()
    .matches(guestIdRegex, ERROR_MESSAGE_GUEST_ID_INVALID)
    .required(ERROR_MESSAGE_GUEST_ID_REQUIRED),
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
      throw new DeleteGuestUserError(err.errors, params);
    }

    await deleteGuestUser(getUserIdOrThrow(req), params.guestId);
    res.status(200).end();
  })
);
async function deleteGuestUser(userId: string, guestId: string) {
  const guestUsers = await UserModel.find({ userId: guestId });
  if (guestUsers.length === 0) {
    throw new DeleteGuestUserError(
      [ERROR_MESSAGE_GUEST_NOT_FOUND],
      [guestId, guestUsers.length]
    );
  }
  if (guestUsers.length > 1) {
    throw new Error(ERROR_MESSAGE_MULTIPLE_GUESTS_FOUND);
  }
  const guestUser = guestUsers[0];
  const guest = guestUser.guest;
  if (guest === undefined) {
    throw new DeleteGuestUserError([ERROR_MESSAGE_NOT_GUEST_USER], { guestId });
  }
  if (guest.createdBy !== userId) {
    throw new DeleteGuestUserError([ERROR_MESSAGE_GUEST_DIFFERENT_CREATOR], {
      guestId,
    });
  }
  const worksByGuest = await WorkModel.find({
    owner: guestUser.userId,
  });
  if (worksByGuest.length !== 0) {
    throw new DeleteGuestUserError([ERROR_MESSAGE_GUEST_WORKS_NOT_EMPTY], {
      guestId,
    });
  }
  await guestUser.delete();
}
export { accountRouter };
