import { TRPCError } from "@trpc/server";
import { UserModel } from "../../../../models/database";
import { creatorIdSchema } from "../../../../services/works";
import { t, authenticatedProcedure } from "../../../../utils/trpc";
import { accountWorkRouter } from "./work";

async function findUserByIdOrNull(userId: string) {
  const users = await UserModel.find({ userId });
  if (users.length > 1) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
  }
  if (users.length === 0) {
    return null
  }
  return users[0];
}

async function findUserByIdOrThrow(userId: string) {
  const user = await findUserByIdOrNull(userId);
  if (user === null) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "存在しないユーザーです" });
  }
  return user;
}


export const accountRouter = t.router({
  getDefaultCreatorId: authenticatedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const user = await findUserByIdOrNull(userId);
    return user?.defaultCreatorId ?? null
  }),
  setDefaultCreatorId: authenticatedProcedure
    .input(creatorIdSchema)
    .mutation(async ({ ctx, input: defaultCreatorId }) => {
      const userId = ctx.user.id;
      const user = await findUserByIdOrThrow(userId);
      await user.updateOne(
        {
          $set: {
            defaultCreatorId,
          },
        },
        { upsert: true }
      )
    }),
  work: accountWorkRouter
});



