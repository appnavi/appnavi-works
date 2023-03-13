import fsExtra from "fs-extra";
import { inferProcedureInput } from "@trpc/server";
import { preparePassport } from "../../../src/config/passport";
import { TRPCRouter } from "../../../src/routes/api/trpc";
import {
  ERROR_MESSAGE_CREATOR_ID_INVALID,
  ERROR_MESSAGE_CREATOR_ID_REQUIRED,
  ERROR_MESSAGE_WORK_DIFFERENT_OWNER,
  ERROR_MESSAGE_WORK_ID_INVALID,
  ERROR_MESSAGE_WORK_ID_REQUIRED,
  ERROR_MESSAGE_WORK_NOT_FOUND,
} from "../../../src/utils/constants";
import { myId, theirId } from "../../auth";
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
import {
  getAbsolutePathOfAllBackups,
  getAbsolutePathOfWork,
} from "../../../src/services/works";
import { TRPC_ERROR_CODE_KEY } from "@trpc/server/dist/rpc";

const creatorId = "creator-trpc-account-cleanupCreatorIds";
const workId = "work-trpc-account-cleanupCreatorIds";

type Input = inferProcedureInput<TRPCRouter["account"]["cleanupCreatorIds"]>;

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
  onSuccess?: () => Promise<void>;
}) {
  return wrap(async (done) => {
    const caller = createTrpcCaller(userId);
    try {
      await caller.account.cleanupCreatorIds(input as Input);
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
    onSuccess()
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
