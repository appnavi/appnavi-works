import { inferProcedureInput, inferProcedureOutput } from "@trpc/server";
import { TRPC_ERROR_CODE_KEY } from "@trpc/server/dist/rpc";
import { preparePassport } from "../../../src/config/passport";
import { UserModel } from "../../../src/models/database";
import { TRPCRouter } from "../../../src/routes/api/trpc";
import { myId } from "../../auth";
import { clearDatabase, connectDatabase, wrap } from "../../common";
import { createTrpcCaller, expectTRPCError } from "../common";

type Input = inferProcedureInput<TRPCRouter["db"]["fetchAllUsers"]>;
type Output = inferProcedureOutput<TRPCRouter["db"]["fetchAllUsers"]>;

function testDbFetchAllUsers({
  userId,
  userType,
  input,
  expectedError,
  onSuccess,
}: {
  userId?: string;
  userType?: "Slack" | "Guest";
  input: unknown;
  expectedError?: {
    code: TRPC_ERROR_CODE_KEY;
    message?: string;
  };
  onSuccess?: (output: Output) => Promise<void>;
}) {
  return wrap(async (done) => {
    const caller = createTrpcCaller(userId, userType ?? "Slack");
    let output: Output;
    try {
      output = await caller.db.fetchAllUsers(input as Input);
    } catch (e) {
      if (expectedError === undefined) {
        done(e);
        return;
      }
      expectTRPCError(e, done, expectedError.code, expectedError.message);
      return;
    }
    if (expectedError !== undefined) {
      done(
        new Error(
          `想定していたエラー(${expectedError.code}, ${expectedError.message})が発生しませんでした。`
        )
      );
      return;
    }
    if (onSuccess === undefined) {
      done();
      return;
    }
    onSuccess(output)
      .then(() => done())
      .catch(done);
  });
}
const userId = "user-trpc-db-fetchAllUsers";
describe("trpc.db.fetchAllUsers", () => {
  beforeAll(async () => {
    await preparePassport();
    await connectDatabase("trpc-db-fetchAllUsers");
  });
  afterEach(async () => {
    await clearDatabase();
  });
  it(
    "非ログイン時はデータを取得できない",
    testDbFetchAllUsers({
      input: undefined,
      expectedError: {
        code: "UNAUTHORIZED",
      },
    })
  );
  it(
    "ゲストログイン時はデータを取得できない",
    testDbFetchAllUsers({
      userId: myId,
      userType: "Guest",
      input: undefined,
      expectedError: {
        code: "FORBIDDEN",
      },
    })
  );
  it(
    "Slackログイン時はデータを取得できる",
    wrap(async (done) => {
      await UserModel.create({
        userId,
      });
      testDbFetchAllUsers({
        userId: myId,
        userType: "Guest",
        input: undefined,
        expectedError: {
          code: "FORBIDDEN",
        },
        async onSuccess(output) {
          expect(output).toHaveLength(1);
          expect(output[0].userId).toBe(userId);
        },
      })(done);
    })
  );
});
