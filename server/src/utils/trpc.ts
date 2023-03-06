import { inferAsyncReturnType, initTRPC } from "@trpc/server";
import { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { fromZodError } from "zod-validation-error";
import { UserOrUndefined } from "../common/types"
import { system } from "../modules/logger";


export function createContext({ req }: CreateExpressContextOptions) {
  const parsed = UserOrUndefined.safeParse(req.user)
  if (!parsed.success) {
    system.error("ユーザーが不正です", fromZodError(parsed.error))
    return {
      user: undefined
    }
  }
  return {
    user: parsed.data
  }
}

export const t = initTRPC.context<inferAsyncReturnType<typeof createContext>>().create();

export const publicProcedure = t.procedure;