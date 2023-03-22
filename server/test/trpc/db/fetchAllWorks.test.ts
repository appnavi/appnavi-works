import { inferProcedureInput, inferProcedureOutput } from "@trpc/server";
import { TRPC_ERROR_CODE_KEY } from "@trpc/server/dist/rpc";
import { preparePassport } from "../../../src/config/passport";
import { WorkModel } from "../../../src/models/database";
import { TRPCRouter } from "../../../src/routes/api/trpc";
import { myId } from "../../auth";
import { clearDatabase, connectDatabase, wrap } from "../../common";
import { createTrpcCaller, expectTRPCError } from "../common";

type Input = inferProcedureInput<TRPCRouter["db"]["fetchAllWorks"]>;
type Output = inferProcedureOutput<TRPCRouter["db"]["fetchAllWorks"]>;

function testDbFetchAllWorks({
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
      output = await caller.db.fetchAllWorks(input as Input);
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
const creatorId = "creator-trpc-db-fetchAllWorks";
const workId = "work-trpc-db-fetchAllWorks";
describe("trpc.db.fetchAllWorks", () => {
  beforeAll(async () => {
    await preparePassport();
    await connectDatabase("trpc-db-fetchAllWorks");
  });
  afterEach(async () => {
    await clearDatabase();
  });
  it(
    "非ログイン時はデータを取得できない",
    testDbFetchAllWorks({
      input: undefined,
      expectedError: {
        code: "UNAUTHORIZED",
      },
    })
  );
  it(
    "ゲストログイン時はデータを取得できない",
    testDbFetchAllWorks({
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
      await WorkModel.create({
        creatorId,
        workId,
        fileSize: 0,
        owner: myId,
        uploadedAt: new Date(),
      });
      testDbFetchAllWorks({
        userId: myId,
        userType: "Guest",
        input: undefined,
        expectedError: {
          code: "FORBIDDEN",
        },
        async onSuccess(output) {
          expect(output).toHaveLength(1);
          expect(output[0].creatorId).toBe(creatorId);
          expect(output[0].workId).toBe(workId);
          expect(output[0].owner).toBe(myId);
        },
      })(done);
    })
  );
});
