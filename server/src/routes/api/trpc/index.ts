import { t, publicProcedure } from "../../../utils/trpc";


export const trpcRouter = t.router({
  test: publicProcedure.query(() => "Hello, World!")
});

export type TRPCRouter = typeof trpcRouter


