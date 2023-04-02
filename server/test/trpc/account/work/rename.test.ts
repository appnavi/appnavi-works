import fsExtra from "fs-extra";
import { inferProcedureInput, inferProcedureOutput } from "@trpc/server";
import { preparePassport } from "../../../../src/config/passport";
import { TRPCRouter } from "../../../../src/routes/api/trpc";
import {
  ERROR_MESSAGE_CREATOR_ID_INVALID,
  ERROR_MESSAGE_CREATOR_ID_REQUIRED,
  ERROR_MESSAGE_CREATOR_ID_USED_BY_OTHER_USER,
  ERROR_MESSAGE_RENAMED_CREATOR_ID_INVALID,
  ERROR_MESSAGE_RENAMED_CREATOR_ID_REQUIRED,
  ERROR_MESSAGE_RENAMED_WORK_ID_INVALID,
  ERROR_MESSAGE_RENAMED_WORK_ID_REQUIRED,
  ERROR_MESSAGE_RENAME_TO_EXISTING,
  ERROR_MESSAGE_RENAME_TO_SAME,
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
import { UserModel, WorkModel } from "../../../../src/models/database";
import {
  getAbsolutePathOfAllBackups,
  getAbsolutePathOfWork,
} from "../../../../src/services/works";
import { TRPC_ERROR_CODE_KEY } from "@trpc/server/dist/rpc";

const creatorId = "creator-trpc-account-work-rename";
const workId = "work-trpc-account-work-rename";
const renamedCreatorId = `${creatorId}-1`;
const renamedWorkId = `${workId}-1`;

type Input = inferProcedureInput<TRPCRouter["account"]["work"]["rename"]>;
type Output = inferProcedureOutput<TRPCRouter["account"]["work"]["rename"]>;

mockFileDestinations("trpc-account-work-rename");

function testWorkRename({
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
      output = await caller.account.work.rename(input as Input);
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

describe("trpc.account.work.rename", () => {
  beforeAll(async () => {
    await preparePassport();
    await connectDatabase("trpc-account-work-rename");
    await ensureUploadFoldersEmpty();
  });
  afterEach(async () => {
    await clearDatabase();
    await ensureUploadFoldersEmpty();
  });
  it(
    "非ログイン時にはリネームできない",
    testWorkRename({
      input: {
        creatorId,
        workId,
        renamedCreatorId,
        renamedWorkId,
      },
      expectedError: {
        code: "UNAUTHORIZED",
      },
    })
  );
  it(
    "作者IDが設定されていないとリネームできない",
    testWorkRename({
      userId: myId,
      input: {
        workId,
        renamedCreatorId,
        renamedWorkId,
      },
      expectedError: {
        code: "BAD_REQUEST",
        message: ERROR_MESSAGE_CREATOR_ID_REQUIRED,
      },
    })
  );
  it(
    "作者IDが不適切だとリネームできない",
    testWorkRename({
      userId: myId,
      input: {
        creatorId: INVALID_ID,
        workId,
        renamedCreatorId,
        renamedWorkId,
      },
      expectedError: {
        code: "BAD_REQUEST",
        message: ERROR_MESSAGE_CREATOR_ID_INVALID,
      },
    })
  );
  it(
    "作品IDが設定されていないとリネームできない",
    testWorkRename({
      userId: myId,
      input: {
        creatorId,
        renamedCreatorId,
        renamedWorkId,
      },
      expectedError: {
        code: "BAD_REQUEST",
        message: ERROR_MESSAGE_WORK_ID_REQUIRED,
      },
    })
  );
  it(
    "作品IDが不適切だとリネームできない",
    testWorkRename({
      userId: myId,
      input: {
        creatorId,
        workId: INVALID_ID,
        renamedCreatorId,
        renamedWorkId,
      },
      expectedError: {
        code: "BAD_REQUEST",
        message: ERROR_MESSAGE_WORK_ID_INVALID,
      },
    })
  );
  it(
    "リネーム後の作者IDが設定されていないとリネームできない",
    testWorkRename({
      userId: myId,
      input: {
        creatorId,
        workId,
        renamedWorkId,
      },
      expectedError: {
        code: "BAD_REQUEST",
        message: ERROR_MESSAGE_RENAMED_CREATOR_ID_REQUIRED,
      },
    })
  );
  it(
    "リネーム後の作者IDが不適切だとリネームできない",
    testWorkRename({
      userId: myId,
      input: {
        creatorId,
        workId,
        renamedCreatorId: INVALID_ID,
        renamedWorkId,
      },
      expectedError: {
        code: "BAD_REQUEST",
        message: ERROR_MESSAGE_RENAMED_CREATOR_ID_INVALID,
      },
    })
  );
  it(
    "リネーム後の作品IDが設定されていないとリネームできない",
    testWorkRename({
      userId: myId,
      input: {
        creatorId,
        workId,
        renamedCreatorId,
      },
      expectedError: {
        code: "BAD_REQUEST",
        message: ERROR_MESSAGE_RENAMED_WORK_ID_REQUIRED,
      },
    })
  );
  it(
    "リネーム後の作品IDが不適切だとリネームできない",
    testWorkRename({
      userId: myId,
      input: {
        creatorId,
        workId,
        renamedCreatorId,
        renamedWorkId: INVALID_ID,
      },
      expectedError: {
        code: "BAD_REQUEST",
        message: ERROR_MESSAGE_RENAMED_WORK_ID_INVALID,
      },
    })
  );
  it(
    "リネーム前とリネーム後が同じだとはリネームできない",
    testWorkRename({
      userId: myId,
      input: {
        creatorId,
        workId,
        renamedCreatorId: creatorId,
        renamedWorkId: workId,
      },
      expectedError: {
        code: "BAD_REQUEST",
        message: ERROR_MESSAGE_RENAME_TO_SAME,
      },
    })
  );
  it(
    "存在しない作品はリネームできない",
    testWorkRename({
      userId: myId,
      input: {
        creatorId,
        workId,
        renamedCreatorId,
        renamedWorkId,
      },
      expectedError: {
        code: "BAD_REQUEST",
        message: ERROR_MESSAGE_WORK_NOT_FOUND,
      },
    })
  );
  it(
    "別人の投稿した作品はリネームできない",
    wrap(async (done) => {
      await WorkModel.create({
        creatorId,
        workId,
        fileSize: 0,
        owner: theirId,
        uploadedAt: new Date(),
      });
      testWorkRename({
        userId: myId,
        input: {
          creatorId,
          workId,
          renamedCreatorId,
          renamedWorkId,
        },
        expectedError: {
          code: "BAD_REQUEST",
          message: ERROR_MESSAGE_WORK_DIFFERENT_OWNER,
        },
      })(done);
    })
  );
  it(
    "別人に使われている作者IDを使うことはできない",
    wrap(async (done) => {
      await UserModel.create({
        userId: theirId,
        creatorIds: [renamedCreatorId],
      });
      await WorkModel.create({
        creatorId,
        workId,
        fileSize: 0,
        owner: myId,
        uploadedAt: new Date(),
      });
      testWorkRename({
        userId: myId,
        input: {
          creatorId,
          workId,
          renamedCreatorId,
          renamedWorkId,
        },
        expectedError: {
          code: "BAD_REQUEST",
          message: ERROR_MESSAGE_CREATOR_ID_USED_BY_OTHER_USER,
        },
      })(done);
    })
  );
  it(
    "既に存在する作品を上書きするようなリネームはできない",
    wrap(async (done) => {
      await WorkModel.create({
        creatorId,
        workId,
        fileSize: 0,
        owner: myId,
        uploadedAt: new Date(),
      });
      await WorkModel.create({
        creatorId: renamedCreatorId,
        workId: renamedWorkId,
        fileSize: 0,
        owner: myId,
        uploadedAt: new Date(),
      });
      testWorkRename({
        userId: myId,
        input: {
          creatorId,
          workId,
          renamedCreatorId,
          renamedWorkId,
        },
        expectedError: {
          code: "BAD_REQUEST",
          message: ERROR_MESSAGE_RENAME_TO_EXISTING,
        },
      })(done);
    })
  );
  it(
    "リネーム後の作品が存在する場合も別人に使われている作者IDを使うことはできない",
    wrap(async (done) => {
      await UserModel.create({
        userId: theirId,
        creatorIds: [renamedCreatorId],
      });
      await WorkModel.create({
        creatorId: renamedCreatorId,
        workId: renamedWorkId,
        fileSize: 0,
        owner: theirId,
        uploadedAt: new Date(),
      });
      await WorkModel.create({
        creatorId,
        workId,
        fileSize: 0,
        owner: myId,
        uploadedAt: new Date(),
      });
      testWorkRename({
        userId: myId,
        input: {
          creatorId,
          workId,
          renamedCreatorId,
          renamedWorkId,
        },
        expectedError: {
          code: "BAD_REQUEST",
          message: ERROR_MESSAGE_CREATOR_ID_USED_BY_OTHER_USER,
        },
      })(done);
    })
  );
  it(
    "条件を満たしていれば作者IDのリネームに成功する",
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
        uploadedAt: new Date(),
      });
      testWorkRename({
        userId: myId,
        input: {
          creatorId,
          workId,
          renamedCreatorId,
          renamedWorkId: workId,
        },
        async onSuccess() {
          expect(
            fsExtra.exists(getAbsolutePathOfWork(renamedCreatorId, workId))
          ).resolves.toBe(true);
          expect(
            fsExtra.exists(
              getAbsolutePathOfAllBackups(renamedCreatorId, workId)
            )
          ).resolves.toBe(true);
          const renamedWorks = await WorkModel.find({
            _id: work._id,
          });
          expect(renamedWorks).toHaveLength(1);
          expect(renamedWorks[0].creatorId).toBe(renamedCreatorId);
          expect(renamedWorks[0].workId).toBe(workId);
        },
      })(done);
    })
  );
  it(
    "条件を満たしていれば作品IDのリネームに成功する",
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
        uploadedAt: new Date(),
      });
      testWorkRename({
        userId: myId,
        input: {
          creatorId,
          workId,
          renamedCreatorId: creatorId,
          renamedWorkId,
        },
        async onSuccess() {
          expect(
            fsExtra.exists(getAbsolutePathOfWork(creatorId, renamedWorkId))
          ).resolves.toBe(true);
          expect(
            fsExtra.exists(
              getAbsolutePathOfAllBackups(creatorId, renamedWorkId)
            )
          ).resolves.toBe(true);
          const renamedWorks = await WorkModel.find({
            _id: work._id,
          });
          expect(renamedWorks).toHaveLength(1);
          expect(renamedWorks[0].creatorId).toBe(creatorId);
          expect(renamedWorks[0].workId).toBe(renamedWorkId);
        },
      })(done);
    })
  );
  it(
    "条件を満たしていれば作者IDと作品ID両方のリネームに成功する",
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
        uploadedAt: new Date(),
      });
      testWorkRename({
        userId: myId,
        input: {
          creatorId,
          workId,
          renamedCreatorId,
          renamedWorkId,
        },
        async onSuccess() {
          expect(
            fsExtra.exists(
              getAbsolutePathOfWork(renamedCreatorId, renamedWorkId)
            )
          ).resolves.toBe(true);
          expect(
            fsExtra.exists(
              getAbsolutePathOfAllBackups(renamedCreatorId, renamedWorkId)
            )
          ).resolves.toBe(true);
          const renamedWorks = await WorkModel.find({
            _id: work._id,
          });
          expect(renamedWorks).toHaveLength(1);
          expect(renamedWorks[0].creatorId).toBe(renamedCreatorId);
          expect(renamedWorks[0].workId).toBe(renamedWorkId);
        },
      })(done);
    })
  );
});
