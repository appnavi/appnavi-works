import { createCsrfTokenInSession } from "../../../services/csrf";
import { t, publicProcedure } from "../../../utils/trpc";
import { accountRouter } from "./account";
import { dbRouter } from "./db";


export const trpcRouter = t.router({
  me: publicProcedure.query(({ ctx }) => ctx.user ?? null),
  csrf: publicProcedure.query(async ({ ctx }) => {
    const { req } = ctx;
    const { csrfToken, csrfTokenWithHash } = req.session;
    if (csrfToken !== undefined && csrfTokenWithHash !== undefined) {
      return csrfToken;
    }
    return await createCsrfTokenInSession(req.session);
  }),
  account: accountRouter,
  db: dbRouter
});

export type TRPCRouter = typeof trpcRouter


