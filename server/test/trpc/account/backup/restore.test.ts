import fsExtra from "fs-extra";
import { inferProcedureInput, inferProcedureOutput } from "@trpc/server";
import { preparePassport } from "../../../../src/config/passport";
import { TRPCRouter } from "../../../../src/routes/api/trpc";
import {
  ERROR_MESSAGE_BACKUP_NAME_INVALID,
  ERROR_MESSAGE_BACKUP_NAME_REQUIRED,
  ERROR_MESSAGE_BACKUP_NOT_FOUND,
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
  getAbsolutePathOfBackup,
  getAbsolutePathOfWork,
} from "../../../../src/services/works";
import { TRPC_ERROR_CODE_KEY } from "@trpc/server/dist/rpc";

const creatorId = "creator-trpc-account-backup-restore";
const workId = "work-trpc-account-backup-restore";
const backupName = "1";

type Input = inferProcedureInput<TRPCRouter["account"]["backup"]["restore"]>;
type Output = inferProcedureOutput<TRPCRouter["account"]["backup"]["restore"]>;

mockFileDestinations("trpc-account-backup-restore");

function testBackupRestore({
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
      output = await caller.account.backup.restore(input as Input);
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

describe("trpc.account.backup.restore", () => {
  beforeAll(async () => {
    await preparePassport();
    await connectDatabase("trpc-account-backup-restore");
    await ensureUploadFoldersEmpty();
  });
  afterEach(async () => {
    await clearDatabase();
    await ensureUploadFoldersEmpty();
  });
  it(
    "非ログイン時にはバックアップを復元できない",
    testBackupRestore({
      input: {
        creatorId,
        workId,
        backupName,
      },
      expectedError: {
        code: "UNAUTHORIZED",
      },
    })
  );
  it(
    "作者IDが設定されていないとバックアップを復元できない",
    testBackupRestore({
      userId: myId,
      input: {
        workId,
        backupName,
      },
      expectedError: {
        code: "BAD_REQUEST",
        message: ERROR_MESSAGE_CREATOR_ID_REQUIRED,
      },
    })
  );
  it(
    "作者IDが不適切だとバックアップを復元できない",
    testBackupRestore({
      userId: myId,
      input: {
        creatorId: INVALID_ID,
        workId,
        backupName,
      },
      expectedError: {
        code: "BAD_REQUEST",
        message: ERROR_MESSAGE_CREATOR_ID_INVALID,
      },
    })
  );
  it(
    "作品IDが設定されていないとバックアップを復元できない",
    testBackupRestore({
      userId: myId,
      input: {
        creatorId,
        backupName,
      },
      expectedError: {
        code: "BAD_REQUEST",
        message: ERROR_MESSAGE_WORK_ID_REQUIRED,
      },
    })
  );
  it(
    "作品IDが不適切だとバックアップを復元できない",
    testBackupRestore({
      userId: myId,
      input: {
        creatorId,
        workId: INVALID_ID,
        backupName,
      },
      expectedError: {
        code: "BAD_REQUEST",
        message: ERROR_MESSAGE_WORK_ID_INVALID,
      },
    })
  );
  it(
    "バックアップ名が設定されていないとバックアップを復元できない",
    testBackupRestore({
      userId: myId,
      input: {
        creatorId,
        workId,
      },
      expectedError: {
        code: "BAD_REQUEST",
        message: ERROR_MESSAGE_BACKUP_NAME_REQUIRED,
      },
    })
  );
  it(
    "バックアップ名が不適切だとバックアップを復元できない",
    testBackupRestore({
      userId: myId,
      input: {
        creatorId,
        workId,
        backupName: INVALID_ID,
      },
      expectedError: {
        code: "BAD_REQUEST",
        message: ERROR_MESSAGE_BACKUP_NAME_INVALID,
      },
    })
  );
  it(
    "存在しない作品のバックアップは復元できない",
    testBackupRestore({
      userId: myId,
      input: {
        creatorId,
        workId,
        backupName,
      },
      expectedError: {
        code: "BAD_REQUEST",
        message: ERROR_MESSAGE_WORK_NOT_FOUND,
      },
    })
  );
  it(
    "別人の投稿した作品のバックアップは復元できない",
    wrap(async (done) => {
      await WorkModel.create({
        creatorId,
        workId,
        fileSize: 0,
        owner: theirId,
        uploadedAt: new Date(),
      });
      testBackupRestore({
        userId: myId,
        input: {
          creatorId,
          workId,
          backupName,
        },
        expectedError: {
          code: "BAD_REQUEST",
          message: ERROR_MESSAGE_WORK_DIFFERENT_OWNER,
        },
      })(done);
    })
  );
  it(
    "存在しないバックアップを復元できない",
    wrap(async (done) => {
      await WorkModel.create({
        creatorId,
        workId,
        fileSize: 0,
        owner: myId,
        uploadedAt: new Date(),
      });
      testBackupRestore({
        userId: myId,
        input: {
          creatorId,
          workId,
          backupName,
        },
        expectedError: {
          code: "BAD_REQUEST",
          message: ERROR_MESSAGE_BACKUP_NOT_FOUND,
        },
      })(done);
    })
  );
  it(
    "条件を満たしているとバックアップを復元できる",
    wrap(async (done) => {
      await WorkModel.create({
        creatorId,
        workId,
        fileSize: 0,
        owner: myId,
        backups: [
          {
            name: backupName,
            fileSize: 0,
            uploadedAt: new Date(),
          },
        ],
        uploadedAt: new Date(),
      });
      await fsExtra.mkdir(getAbsolutePathOfWork(creatorId, workId), {
        recursive: true,
      });
      await fsExtra.mkdir(
        getAbsolutePathOfBackup(creatorId, workId, backupName),
        { recursive: true }
      );
      testBackupRestore({
        userId: myId,
        input: {
          creatorId,
          workId,
          backupName,
        },
        async onSuccess() {
          expect(
            fsExtra.pathExists(getAbsolutePathOfWork(creatorId, workId))
          ).resolves.toBe(true);
          expect(
            fsExtra.pathExists(
              getAbsolutePathOfBackup(creatorId, workId, backupName)
            )
          ).resolves.toBe(false);
          expect(
            fsExtra.pathExists(getAbsolutePathOfBackup(creatorId, workId, "2"))
          ).resolves.toBe(true);
        },
      })(done);
    })
  );
});
