import express from "express";
import multer from "multer";
import { z } from "zod";
import { guestUserIdRegex } from "../../config/passport";
import { UserModel, WorkModel } from "../../models/database";
import { getUserIdOrThrow } from "../../services/auth";
import { hashPassword } from "../../services/auth/password";
import {
  ERROR_MESSAGE_GUEST_NOT_FOUND,
  ERROR_MESSAGE_MULTIPLE_GUESTS_FOUND,
  ERROR_MESSAGE_NOT_GUEST_USER,
  ERROR_MESSAGE_GUEST_WORKS_NOT_EMPTY,
  ERROR_MESSAGE_GUEST_DIFFERENT_CREATOR,
  ERROR_MESSAGE_GUEST_ID_INVALID,
  ERROR_MESSAGE_GUEST_ID_REQUIRED,
} from "../../utils/constants";
import { DeleteGuestUserError } from "../../utils/errors";
import {
  generateRandomString,
  render,
  slackUserOnly,
  wrap,
} from "../../utils/helpers";

const guestRouter = express.Router();
guestRouter.use(slackUserOnly);
guestRouter.get(
  "/",
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
guestRouter.post(
  "/create",
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
    const hashedPassword = await hashPassword(password);
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
const deleteGuestSchema = z.object({
  guestId: z
    .string({ required_error: ERROR_MESSAGE_GUEST_ID_REQUIRED })
    .regex(guestUserIdRegex, ERROR_MESSAGE_GUEST_ID_INVALID),
});
guestRouter.post(
  "/delete",
  multer().none(),
  wrap(async (req, res) => {
    const params = req.body as {
      guestId: string;
    };
    const parsed = deleteGuestSchema.safeParse(params);
    if (!parsed.success) {
      throw new DeleteGuestUserError(
        parsed.error.errors.map((x) => x.message),
        params
      );
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

export { guestRouter };
