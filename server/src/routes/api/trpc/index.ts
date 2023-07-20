import { t, publicProcedure } from "../../../utils/trpc";
import { accountRouter } from "./account";
import { dbRouter } from "./db";

export const trpcRouter = t.router({
  me: publicProcedure.query(({ ctx }) => ctx.user ?? null),
  account: accountRouter,
  db: dbRouter,
});

export type TRPCRouter = typeof trpcRouter;
