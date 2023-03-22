import { inferProcedureInput, inferProcedureOutput } from "@trpc/server";
import { preparePassport } from "../../../src/config/passport";
import { TRPCRouter } from "../../../src/routes/api/trpc";
import { myId } from "../../auth";
import {
  clearDatabase,
  connectDatabase,
  ensureUploadFoldersEmpty,
  mockFileDestinations,
  wrap,
} from "../../common";
import { createTrpcCaller, expectTRPCError } from "../common";
import { UserModel, WorkModel } from "../../../src/models/database";
import { TRPC_ERROR_CODE_KEY } from "@trpc/server/dist/rpc";

const creatorId = "creator-trpc-account-cleanupCreatorIds";
const workId = "work-trpc-account-cleanupCreatorIds";

type Input = inferProcedureInput<TRPCRouter["account"]["cleanupCreatorIds"]>;
type Output = inferProcedureOutput<TRPCRouter["account"]["cleanupCreatorIds"]>;

mockFileDestinations("trpc-account-cleanupCreatorIds");

function testCleanupCreatorIds({
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
      output = await caller.account.cleanupCreatorIds(input as Input);
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

describe("trpc.account.cleanupCreatorIds", () => {
  beforeAll(async () => {
    await preparePassport();
    await connectDatabase("trpc-account-cleanupCreatorIds");
    await ensureUploadFoldersEmpty();
  });
  afterEach(async () => {
    await clearDatabase();
    await ensureUploadFoldersEmpty();
  });
  it(
    "非ログイン時はエラーになる",
    testCleanupCreatorIds({
      input: undefined,
      expectedError: {
        code: "UNAUTHORIZED",
      },
    })
  );
  it(
    "一つも作品を投稿していない状態では、何も起こらない",
    wrap(async (done) => {
      const user = await UserModel.create({
        userId: myId,
        creatorIds: [],
      });
      testCleanupCreatorIds({
        userId: myId,
        input: undefined,
        async onSuccess() {
          const users = await UserModel.find({
            _id: user._id,
          });
          expect(users).toHaveLength(1);
          expect(users[0].creatorIds).toHaveLength(0);
        },
      })(done);
    })
  );
  it(
    "使用中の作者IDは削除されない",
    wrap(async (done) => {
      const user = await UserModel.create({
        userId: myId,
        creatorIds: [creatorId],
      });
      await WorkModel.create({
        creatorId,
        workId,
        owner: myId,
        fileSize: 0,
        uploadedAt: new Date(),
      });
      testCleanupCreatorIds({
        userId: myId,
        input: undefined,
        async onSuccess() {
          const users = await UserModel.find({
            _id: user._id,
          });
          expect(users).toHaveLength(1);
          expect(users[0].creatorIds).toHaveLength(1);
          expect(users[0].creatorIds[0]).toBe(creatorId);
        },
      })(done);
    })
  );
  it(
    "使用されていない作者IDが削除される",
    wrap(async (done) => {
      const user = await UserModel.create({
        userId: myId,
        creatorIds: [creatorId],
      });
      testCleanupCreatorIds({
        userId: myId,
        input: undefined,
        async onSuccess() {
          const users = await UserModel.find({
            _id: user._id,
          });
          expect(users).toHaveLength(1);
          expect(users[0].creatorIds).toHaveLength(0);
        },
      })(done);
    })
  );
  it(
    "使用されていない作者IDが複数ある場合、全て削除される",
    wrap(async (done) => {
      const user = await UserModel.create({
        userId: myId,
        creatorIds: [
          `${creatorId}-1`,
          `${creatorId}-2`,
          `${creatorId}-3`,
          `${creatorId}-4`,
          `${creatorId}-5`,
        ],
      });
      testCleanupCreatorIds({
        userId: myId,
        input: undefined,
        async onSuccess() {
          const users = await UserModel.find({
            _id: user._id,
          });
          expect(users).toHaveLength(1);
          expect(users[0].creatorIds).toHaveLength(0);
        },
      })(done);
    })
  );
});
