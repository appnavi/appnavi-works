import { TRPCError } from "@trpc/server";
import { UserModel } from "../../../../models/database";
import { t, authenticatedProcedure } from "../../../../utils/trpc";

async function findUserById(userId: string) {
  const users = await UserModel.find({ userId });
  if (users.length > 1) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
  }
  if (users.length === 0) {
    return null
  }
  return users[0];
}


export const accountRouter = t.router({
  getDefaultCreatorId: authenticatedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const user = await findUserById(userId);
    return user?.defaultCreatorId ?? null
  }),
});



