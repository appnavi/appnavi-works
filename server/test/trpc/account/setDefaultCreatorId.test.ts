import { inferProcedureInput, inferProcedureOutput } from "@trpc/server";
import { preparePassport } from "../../../src/config/passport";
import { TRPCRouter } from "../../../src/routes/api/trpc";
import { myId } from "../../auth";
import {
  clearDatabase,
  connectDatabase,
  ensureUploadFoldersEmpty,
  INVALID_ID,
  mockFileDestinations,
  wrap,
} from "../../common";
import { createTrpcCaller, expectTRPCError } from "../common";
import { UserModel, WorkModel } from "../../../src/models/database";
import { TRPC_ERROR_CODE_KEY } from "@trpc/server/dist/rpc";
import {
  ERROR_MESSAGE_CREATOR_ID_INVALID,
  ERROR_MESSAGE_CREATOR_ID_REQUIRED,
} from "../../../src/utils/constants";

type Input = inferProcedureInput<TRPCRouter["account"]["setDefaultCreatorId"]>;
type Output = inferProcedureOutput<
  TRPCRouter["account"]["setDefaultCreatorId"]
>;

mockFileDestinations("trpc-account-setDefaultCreatorId");

function testSetDefaultCreatorId({
  userId,
  input,
  expectedError,
  onSuccess,
}: {
  userId?: string;
  input: unknown;
  expectedError?: {
    code: TRPC_ERROR_CODE_KEY;
    message?: string;
  };
  onSuccess?: (output: Output) => Promise<void>;
}) {
  return wrap(async (done) => {
    const caller = createTrpcCaller(userId);
    let output: Output;
    try {
      output = await caller.account.setDefaultCreatorId(input as Input);
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
const defaultCreatorId =
  "default-creator-id-trpc-account-set-default-creator-id";

describe("trpc.account.setDefaultCreatorId", () => {
  beforeAll(async () => {
    await preparePassport();
    await connectDatabase("trpc-account-setDefaultCreatorId");
    await ensureUploadFoldersEmpty();
  });
  afterEach(async () => {
    await clearDatabase();
    await ensureUploadFoldersEmpty();
  });
  it(
    "ログインしていなければデフォルトの作者IDを設定できない",
    testSetDefaultCreatorId({
      input: defaultCreatorId,
      expectedError: {
        code: "UNAUTHORIZED",
      },
    })
  );
  it(
    "作者IDが指定されていないとデフォルトの作者IDを設定できない",
    testSetDefaultCreatorId({
      userId: myId,
      input: undefined,
      expectedError: {
        code: "BAD_REQUEST",
        message: ERROR_MESSAGE_CREATOR_ID_REQUIRED,
      },
    })
  );
  it(
    "作者IDが不適切だとデフォルトの作者IDを設定できない",
    testSetDefaultCreatorId({
      userId: myId,
      input: INVALID_ID,
      expectedError: {
        code: "BAD_REQUEST",
        message: ERROR_MESSAGE_CREATOR_ID_INVALID,
      },
    })
  );
  it(
    "条件を満たしていればデフォルトの作者IDを設定できる",
    wrap(async (done) => {
      await UserModel.create({
        userId: myId,
      });
      testSetDefaultCreatorId({
        userId: myId,
        input: defaultCreatorId,
        async onSuccess() {
          const users = await UserModel.find({
            userId: myId,
          });
          expect(users).toHaveLength(1);
          expect(users[0].defaultCreatorId).toBe(defaultCreatorId);
        },
      })(done);
    })
  );
});
