import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ErrorResponse } from "../../../../../common/types";
import { guestUserIdRegex } from "../../../../../config/passport";
import { UserModel, WorkModel } from "../../../../../models/database";
import { hashPassword } from "../../../../../services/auth/password";
import { ERROR_MESSAGE_GUEST_DIFFERENT_CREATOR, ERROR_MESSAGE_GUEST_ID_INVALID, ERROR_MESSAGE_GUEST_ID_REQUIRED, ERROR_MESSAGE_GUEST_NOT_FOUND, ERROR_MESSAGE_GUEST_WORKS_NOT_EMPTY, ERROR_MESSAGE_MULTIPLE_GUESTS_FOUND, ERROR_MESSAGE_NOT_GUEST_USER } from "../../../../../utils/constants";
import { DeleteGuestUserError } from "../../../../../utils/errors";
import { generateRandomString } from "../../../../../utils/helpers";
import { slackUserOnlyProcedure, t } from "../../../../../utils/trpc";

async function generateGuestId() {
  for (; ;) {
    const guestId = `guest-${generateRandomString(6)}`;
    const users = await UserModel.find({ userId: guestId });
    if (users.length == 0) {
      return guestId;
    }
  }
}


export const accountGuestRouter = t.router({
  create: slackUserOnlyProcedure.mutation(async ({ ctx }) => {
    const guestId = await generateGuestId();
    const password = generateRandomString(16);
    const hashedPassword = await hashPassword(password);
    await UserModel.create({
      userId: guestId,
      guest: {
        hashedPassword,
        createdBy: ctx.user.id,
      },
    });
    return {
      guestId,
      password
    }
  }),
  delete: slackUserOnlyProcedure.input(z.object({
    guestId: z
      .string({ required_error: ERROR_MESSAGE_GUEST_ID_REQUIRED })
      .regex(guestUserIdRegex, ERROR_MESSAGE_GUEST_ID_INVALID),
  })).mutation(async ({ ctx, input }) => {
    const { guestId } = input;
    try {
      await deleteGuestUser(ctx.user.id, guestId);
    } catch (err) {
      if (err instanceof DeleteGuestUserError) {
        const cause: ErrorResponse = {
          errors: err.errors.map(x => String(x))
        }
        throw new TRPCError({ code: "BAD_REQUEST", cause })
      }
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: err })
    }
  })
})

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