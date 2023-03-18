import { TRPCError } from "@trpc/server";
import { t, publicProcedure } from "../../../utils/trpc";
import { accountRouter } from "./account";
import { dbRouter } from "./db";

export const trpcRouter = t.router({
  me: publicProcedure.query(({ ctx }) => ctx.user ?? null),
  csrf: publicProcedure.query(async ({ ctx }) => {
    const { csrfToken } = ctx;
    if (csrfToken === undefined) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "CSRFトークンが取得できませんでした",
      });
    }
    return csrfToken;
  }),
  account: accountRouter,
  db: dbRouter,
});

export type TRPCRouter = typeof trpcRouter;
