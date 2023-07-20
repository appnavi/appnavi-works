import { TRPCError } from "@trpc/server";
import { TRPC_ERROR_CODE_KEY } from "@trpc/server/dist/rpc";
import { z, ZodError } from "zod";
import { type User } from "../../src/common/types";
import { trpcRouter } from "../../src/routes/api/trpc";

export function createTrpcCaller(
  userId: string | undefined = undefined,
  type: "Slack" | "Guest" = "Slack",
) {
  const user: User | undefined =
    userId === undefined
      ? undefined
      : {
          id: userId,
          type,
          name: "",
          avatar_url: "",
        };
  return trpcRouter.createCaller({ user });
}

const TRPCErrorMessage = z
  .object({
    message: z.string(),
  })
  .array();

export function expectTRPCError(
  error: unknown,
  done: jest.DoneCallback,
  code: TRPC_ERROR_CODE_KEY,
  message: string | undefined = undefined,
) {
  if (!(error instanceof TRPCError)) {
    done(new Error("エラーの型が TRPCError ではありません。"));
    return;
  }
  expect(error.code).toBe(code);
  if (message === undefined) {
    done();
    return;
  }
  const { cause } = error;
  if (cause instanceof ZodError) {
    const parsed = TRPCErrorMessage.safeParse(JSON.parse(error.message));
    if (!parsed.success) {
      done(parsed.error);
      return;
    }
    expect(parsed.data[0].message).toBe(message);
    done();
    return;
  }
  expect(error.message).toBe(message);
  done();
}
