import { initTRPC } from "@trpc/server";

const t = initTRPC.create();

export const trpcRouter = t.router({
  test: t.procedure.query(() => "Hello, World!")
});

export type TRPCRouter = typeof trpcRouter


