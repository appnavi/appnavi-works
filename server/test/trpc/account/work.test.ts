import path from "path";
import fsExtra from "fs-extra";
import { inferProcedureInput } from "@trpc/server";
import { preparePassport } from "../../../src/config/passport";
import { TRPCRouter } from "../../../src/routes/api/trpc";
import {
  ERROR_MESSAGE_CREATOR_ID_INVALID,
  ERROR_MESSAGE_CREATOR_ID_REQUIRED,
  ERROR_MESSAGE_RENAME_TO_EXISTING,
  ERROR_MESSAGE_RENAME_TO_SAME,
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
import { WorkModel } from "../../../src/models/database";
import { getAbsolutePathOfWork } from "../../../src/services/works";

const creatorId = "creator-trpc-account-work";
const workId = "work-trpc-account-work";
const renamedCreatorId = `${creatorId}-1`;
const renamedWorkId = `${workId}-1`;

type RenameInput = inferProcedureInput<TRPCRouter["account"]["work"]["rename"]>;

mockFileDestinations("trpc-account-work");
jest.mock("../../../src/services/works", () => {
  const originalModule = jest.requireActual("../../../src/services/works");
  return {
    __esModule: true,
    ...originalModule,
    absolutePathOfWorkFolder: `/app/server/test-files/trpc-account-work/uploads`,
    absolutePathOfBackupFolder: `/app/server/test-files/trpc-account-work/backups/uploads`,
    getAbsolutePathOfWork(creatorId: string, workId: string) {
      return `/app/server/test-files/trpc-account-work/uploads/${creatorId}/${workId}`;
    },
    getAbsolutePathOfAllBackups(creatorId: string, workId: string) {
      return `/app/server/test-files/trpc-account-work/backups/uploads${creatorId}/${workId}`;
    },
    getAbsolutePathOfBackup(
      creatorId: string,
      workId: string,
      backupName: string
    ) {
      return `/app/server/test-files/trpc-account-work/backups/uploads${creatorId}/${workId}/${backupName}`;
    },
  };
});

describe("/api/trpc/account/work", () => {
  beforeAll(async () => {
    await preparePassport();
    await connectDatabase("api_rpc_account_work");
    await ensureUploadFoldersEmpty();
  });
  afterEach(async () => {
    await clearDatabase();
    await ensureUploadFoldersEmpty();
  });
  describe("作品のリネーム", () => {
    it(
      "非ログイン時にはリネームできない",
      wrap(async (done) => {
        const caller = createTrpcCaller();
        try {
          await caller.account.work.rename({
            creatorId,
            workId,
            renamedCreatorId,
            renamedWorkId,
          });
        } catch (e) {
          expectTRPCError(e, done, "UNAUTHORIZED");
          return;
        }
        done(new Error());
      })
    );
    it(
      "作者IDが設定されていないとリネームできない",
      wrap(async (done) => {
        const caller = createTrpcCaller(myId);
        const input = {
          workId,
          renamedCreatorId,
          renamedWorkId,
        } as RenameInput;
        try {
          await caller.account.work.rename(input);
        } catch (e) {
          expectTRPCError(
            e,
            done,
            "BAD_REQUEST",
            ERROR_MESSAGE_CREATOR_ID_REQUIRED
          );
          return;
        }
        done(new Error());
      })
    );
    it(
      "作者IDが不適切だとリネームできない",
      wrap(async (done) => {
        const caller = createTrpcCaller(myId);
        const input = {
          creatorId: INVALID_ID,
          workId,
          renamedCreatorId,
          renamedWorkId,
        } as RenameInput;
        try {
          await caller.account.work.rename(input);
        } catch (e) {
          expectTRPCError(
            e,
            done,
            "BAD_REQUEST",
            ERROR_MESSAGE_CREATOR_ID_INVALID
          );
          return;
        }
        done(new Error());
      })
    );
    it(
      "作品IDが設定されていないとリネームできない",
      wrap(async (done) => {
        const caller = createTrpcCaller(myId);
        const input = {
          creatorId,
          renamedCreatorId,
          renamedWorkId,
        } as RenameInput;
        try {
          await caller.account.work.rename(input);
        } catch (e) {
          expectTRPCError(
            e,
            done,
            "BAD_REQUEST",
            ERROR_MESSAGE_WORK_ID_REQUIRED
          );
          return;
        }
        done(new Error());
      })
    );
    it(
      "作品IDが不適切だとリネームできない",
      wrap(async (done) => {
        const caller = createTrpcCaller(myId);
        const input = {
          creatorId,
          workId: INVALID_ID,
          renamedCreatorId,
          renamedWorkId,
        } as RenameInput;
        try {
          await caller.account.work.rename(input);
        } catch (e) {
          expectTRPCError(
            e,
            done,
            "BAD_REQUEST",
            ERROR_MESSAGE_WORK_ID_INVALID
          );
          return;
        }
        done(new Error());
      })
    );
    it(
      "リネーム後の作者IDが設定されていないとリネームできない",
      wrap(async (done) => {
        const caller = createTrpcCaller(myId);
        const input = {
          creatorId,
          workId,
          renamedWorkId,
        } as RenameInput;
        try {
          await caller.account.work.rename(input);
        } catch (e) {
          expectTRPCError(
            e,
            done,
            "BAD_REQUEST",
            ERROR_MESSAGE_CREATOR_ID_REQUIRED
          );
          return;
        }
        done(new Error());
      })
    );
    it(
      "リネーム後の作者IDが不適切だとリネームできない",
      wrap(async (done) => {
        const caller = createTrpcCaller(myId);
        const input = {
          creatorId,
          workId,
          renamedCreatorId: INVALID_ID,
          renamedWorkId,
        } as RenameInput;
        try {
          await caller.account.work.rename(input);
        } catch (e) {
          expectTRPCError(
            e,
            done,
            "BAD_REQUEST",
            ERROR_MESSAGE_CREATOR_ID_INVALID
          );
          return;
        }
        done(new Error());
      })
    );
    it(
      "リネーム後の作品IDが設定されていないとリネームできない",
      wrap(async (done) => {
        const caller = createTrpcCaller(myId);
        const input = {
          creatorId,
          workId,
          renamedCreatorId,
        } as RenameInput;
        try {
          await caller.account.work.rename(input);
        } catch (e) {
          expectTRPCError(
            e,
            done,
            "BAD_REQUEST",
            ERROR_MESSAGE_WORK_ID_REQUIRED
          );
          return;
        }
        done(new Error());
      })
    );
    it(
      "リネーム後の作品IDが不適切だとリネームできない",
      wrap(async (done) => {
        const caller = createTrpcCaller(myId);
        const input = {
          creatorId,
          workId,
          renamedCreatorId,
          renamedWorkId: INVALID_ID,
        } as RenameInput;
        try {
          await caller.account.work.rename(input);
        } catch (e) {
          expectTRPCError(
            e,
            done,
            "BAD_REQUEST",
            ERROR_MESSAGE_WORK_ID_INVALID
          );
          return;
        }
        done(new Error());
      })
    );
    it(
      "リネーム前とリネーム後が同じだとはリネームできない",
      wrap(async (done) => {
        const caller = createTrpcCaller(myId);
        const input = {
          creatorId,
          workId,
          renamedCreatorId: creatorId,
          renamedWorkId: workId,
        } as RenameInput;
        try {
          await caller.account.work.rename(input);
        } catch (e) {
          expectTRPCError(e, done, "BAD_REQUEST", ERROR_MESSAGE_RENAME_TO_SAME);
          return;
        }
        done(new Error());
      })
    );
    it(
      "存在しない作品はリネームできない",
      wrap(async (done) => {
        const caller = createTrpcCaller(myId);
        const input = {
          creatorId,
          workId,
          renamedCreatorId,
          renamedWorkId,
        } as RenameInput;
        try {
          await caller.account.work.rename(input);
        } catch (e) {
          expectTRPCError(e, done, "BAD_REQUEST", ERROR_MESSAGE_WORK_NOT_FOUND);
          return;
        }
        done(new Error());
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
        });
        const caller = createTrpcCaller(myId);
        const input = {
          creatorId,
          workId,
          renamedCreatorId,
          renamedWorkId,
        } as RenameInput;
        try {
          await caller.account.work.rename(input);
        } catch (e) {
          expectTRPCError(
            e,
            done,
            "BAD_REQUEST",
            ERROR_MESSAGE_WORK_DIFFERENT_OWNER
          );
          return;
        }
        done(new Error());
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
        });
        await WorkModel.create({
          creatorId: renamedCreatorId,
          workId: renamedWorkId,
          fileSize: 0,
          owner: myId,
        });
        const caller = createTrpcCaller(myId);
        const input = {
          creatorId,
          workId,
          renamedCreatorId,
          renamedWorkId,
        } as RenameInput;
        try {
          await caller.account.work.rename(input);
        } catch (e) {
          expectTRPCError(
            e,
            done,
            "BAD_REQUEST",
            ERROR_MESSAGE_RENAME_TO_EXISTING
          );
          return;
        }
        done(new Error());
      })
    );
    it(
      "条件を満たしていれば作者IDのリネームに成功する",
      wrap(async (done) => {
        await fsExtra.mkdir(getAbsolutePathOfWork(creatorId, workId), {
          recursive: true,
        });
        await WorkModel.create({
          creatorId,
          workId,
          fileSize: 0,
          owner: myId,
        });
        const caller = createTrpcCaller(myId);
        const input = {
          creatorId,
          workId,
          renamedCreatorId,
          renamedWorkId: workId,
        } as RenameInput;
        await caller.account.work.rename(input);
        done();
      })
    );
    it(
      "条件を満たしていれば作品IDのリネームに成功する",
      wrap(async (done) => {
        await fsExtra.mkdir(getAbsolutePathOfWork(creatorId, workId), {
          recursive: true,
        });
        await WorkModel.create({
          creatorId,
          workId,
          fileSize: 0,
          owner: myId,
        });
        const caller = createTrpcCaller(myId);
        const input = {
          creatorId,
          workId,
          renamedCreatorId: creatorId,
          renamedWorkId,
        } as RenameInput;
        await caller.account.work.rename(input);
        done();
      })
    );
    it(
      "条件を満たしていれば作者IDと作品ID両方のリネームに成功する",
      wrap(async (done) => {
        await fsExtra.mkdir(getAbsolutePathOfWork(creatorId, workId), {
          recursive: true,
        });
        await WorkModel.create({
          creatorId,
          workId,
          fileSize: 0,
          owner: myId,
        });
        const caller = createTrpcCaller(myId);
        const input = {
          creatorId,
          workId,
          renamedCreatorId,
          renamedWorkId,
        } as RenameInput;
        await caller.account.work.rename(input);
        done();
      })
    );
  });
});
