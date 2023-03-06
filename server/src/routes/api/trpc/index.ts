import { t, publicProcedure } from "../../../utils/trpc";


export const trpcRouter = t.router({
  me: publicProcedure.query(({ ctx }) => ctx.user)
});

export type TRPCRouter = typeof trpcRouter


