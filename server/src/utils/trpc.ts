import { inferAsyncReturnType, initTRPC, TRPCError } from "@trpc/server";
import { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import superjson from "superjson";
import { fromZodError } from "zod-validation-error";
import { UserOrUndefined } from "../common/types";
import { system } from "../modules/logger";

export function createContext({ req }: CreateExpressContextOptions) {
  const parsed = UserOrUndefined.safeParse(req.user);
  if (!parsed.success) {
    system.error("ユーザーが不正です", fromZodError(parsed.error));
    return {
      user: undefined,
      req,
    };
  }
  return {
    user: parsed.data,
    req,
  };
}

export const t = initTRPC
  .context<inferAsyncReturnType<typeof createContext>>()
  .create({
    transformer: superjson,
  });

const requireAuth = t.middleware(({ ctx, next }) => {
  const user = ctx.user;
  if (user === undefined) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      user,
    },
  });
});

const slackUserOnly = t.middleware(({ ctx, next }) => {
  const user = ctx.user;
  if (user === undefined) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  if (user.type !== "Slack") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({
    ctx: {
      user,
    },
  });
});

export const publicProcedure = t.procedure;
export const authenticatedProcedure = t.procedure.use(requireAuth);
export const slackUserOnlyProcedure = t.procedure.use(slackUserOnly);
