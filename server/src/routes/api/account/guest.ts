import express from "express";
import multer from "multer";
import { z } from "zod";
import { guestUserIdRegex } from "../../../config/passport";
import { UserModel, WorkModel } from "../../../models/database";
import { getUserIdOrThrow } from "../../../services/auth";
import {
  ERROR_MESSAGE_GUEST_NOT_FOUND,
  ERROR_MESSAGE_MULTIPLE_GUESTS_FOUND,
  ERROR_MESSAGE_NOT_GUEST_USER,
  ERROR_MESSAGE_GUEST_WORKS_NOT_EMPTY,
  ERROR_MESSAGE_GUEST_DIFFERENT_CREATOR,
  ERROR_MESSAGE_GUEST_ID_INVALID,
  ERROR_MESSAGE_GUEST_ID_REQUIRED,
} from "../../../utils/constants";
import { DeleteGuestUserError } from "../../../utils/errors";
import { slackUserOnly, wrap } from "../../../utils/helpers";

const guestRouter = express.Router();
guestRouter.use(slackUserOnly);
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
