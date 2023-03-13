import fsExtra from "fs-extra";
import { inferProcedureInput } from "@trpc/server";
import { preparePassport } from "../../../../src/config/passport";
import { TRPCRouter } from "../../../../src/routes/api/trpc";
import {
  ERROR_MESSAGE_CREATOR_ID_INVALID,
  ERROR_MESSAGE_CREATOR_ID_REQUIRED,
  ERROR_MESSAGE_WORK_DIFFERENT_OWNER,
  ERROR_MESSAGE_WORK_ID_INVALID,
  ERROR_MESSAGE_WORK_ID_REQUIRED,
  ERROR_MESSAGE_WORK_NOT_FOUND,
} from "../../../../src/utils/constants";
import { myId, theirId } from "../../../auth";
import {
  clearDatabase,
  connectDatabase,
  ensureUploadFoldersEmpty,
  INVALID_ID,
  mockFileDestinations,
  wrap,
} from "../../../common";
import { createTrpcCaller, expectTRPCError } from "../../common";
import { WorkModel } from "../../../../src/models/database";
import {
  getAbsolutePathOfAllBackups,
  getAbsolutePathOfWork,
} from "../../../../src/services/works";
import { TRPC_ERROR_CODE_KEY } from "@trpc/server/dist/rpc";

const creatorId = "creator-trpc-account-work-delete";
const workId = "work-trpc-account-work-delete";

type Input = inferProcedureInput<TRPCRouter["account"]["work"]["delete"]>;

mockFileDestinations("trpc-account-work-delete");

function testWorkDelete({
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
      await caller.account.work.delete(input as Input);
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

describe("trpc.account.work.delete", () => {
  beforeAll(async () => {
    await preparePassport();
    await connectDatabase("trpc-account-work-delete");
    await ensureUploadFoldersEmpty();
  });
  afterEach(async () => {
    await clearDatabase();
    await ensureUploadFoldersEmpty();
  });
  it(
    "非ログイン時には削除できない",
    testWorkDelete({
      input: {
        creatorId,
        workId,
      },
      expectedError: {
        code: "UNAUTHORIZED",
      },
    })
  );
  it(
    "作者IDが設定されていないと削除できない",
    testWorkDelete({
      userId: myId,
      input: {
        workId,
      },
      expectedError: {
        code: "BAD_REQUEST",
        message: ERROR_MESSAGE_CREATOR_ID_REQUIRED,
      },
    })
  );
  it(
    "作者IDが不適切だと削除できない",
    testWorkDelete({
      userId: myId,
      input: {
        creatorId: INVALID_ID,
        workId,
      },
      expectedError: {
        code: "BAD_REQUEST",
        message: ERROR_MESSAGE_CREATOR_ID_INVALID,
      },
    })
  );
  it(
    "作品IDが設定されていないと削除できない",
    testWorkDelete({
      userId: myId,
      input: {
        creatorId,
      },
      expectedError: {
        code: "BAD_REQUEST",
        message: ERROR_MESSAGE_WORK_ID_REQUIRED,
      },
    })
  );
  it(
    "作品IDが不適切だと削除できない",
    testWorkDelete({
      userId: myId,
      input: {
        creatorId,
        workId: INVALID_ID,
      },
      expectedError: {
        code: "BAD_REQUEST",
        message: ERROR_MESSAGE_WORK_ID_INVALID,
      },
    })
  );
  it(
    "存在しない作品は削除できない",
    testWorkDelete({
      userId: myId,
      input: {
        creatorId,
        workId,
      },
      expectedError: {
        code: "BAD_REQUEST",
        message: ERROR_MESSAGE_WORK_NOT_FOUND,
      },
    })
  );
  it(
    "別人の投稿した作品は削除できない",
    wrap(async (done) => {
      await WorkModel.create({
        creatorId,
        workId,
        fileSize: 0,
        owner: theirId,
      });
      testWorkDelete({
        userId: myId,
        input: {
          creatorId,
          workId,
        },
        expectedError: {
          code: "BAD_REQUEST",
          message: ERROR_MESSAGE_WORK_DIFFERENT_OWNER,
        },
      })(done);
    })
  );
  it(
    "条件を満たしていれば作品の削除に成功する",
    wrap(async (done) => {
      await fsExtra.mkdir(getAbsolutePathOfWork(creatorId, workId), {
        recursive: true,
      });
      await fsExtra.mkdir(getAbsolutePathOfAllBackups(creatorId, workId), {
        recursive: true,
      });
      const work = await WorkModel.create({
        creatorId,
        workId,
        fileSize: 0,
        owner: myId,
      });
      testWorkDelete({
        userId: myId,
        input: {
          creatorId,
          workId,
        },
        async onSuccess() {
          expect(
            fsExtra.pathExists(getAbsolutePathOfWork(creatorId, workId))
          ).resolves.toBe(false);
          expect(
            fsExtra.pathExists(getAbsolutePathOfAllBackups(creatorId, workId))
          ).resolves.toBe(false);
          expect(WorkModel.find({ _id: work._id })).resolves.toHaveLength(0);
        },
      })(done);
    })
  );
});
