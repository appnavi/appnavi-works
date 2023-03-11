import path from "path";
import { TRPCError } from "@trpc/server";
import fsExtra from "fs-extra";
import { z } from "zod";
import { ErrorResponse } from "../../../../../common/types";
import {
  backupWork,
  creatorIdSchema,
  findOwnWorkOrError,
  workIdSchema,
} from "../../../../../services/works";
import {
  DIRECTORY_NAME_BACKUPS,
  DIRECTORY_NAME_UPLOADS,
  ERROR_MESSAGE_BACKUP_NAME_INVALID,
  ERROR_MESSAGE_BACKUP_NAME_REQUIRED,
  ERROR_MESSAGE_BACKUP_NOT_FOUND,
} from "../../../../../utils/constants";
import { authenticatedProcedure, t } from "../../../../../utils/trpc";

const accountBackupProcedure = authenticatedProcedure.input(
  z.object({
    creatorId: creatorIdSchema,
    workId: workIdSchema,
    backupName: z
      .string({ required_error: ERROR_MESSAGE_BACKUP_NAME_REQUIRED })
      .regex(/^\d+$/, ERROR_MESSAGE_BACKUP_NAME_INVALID),
  })
);

export const accountBackupRouter = t.router({
  restore: accountBackupProcedure.mutation(async ({ ctx, input }) => {
    const { creatorId, workId, backupName } = input;
    const errorResponse = await restoreBackup(
      creatorId,
      workId,
      ctx.user.id,
      backupName
    );
    if (errorResponse !== null) {
      throw new TRPCError({ code: "BAD_REQUEST", cause: errorResponse });
    }
  }),
  delete: accountBackupProcedure.mutation(async ({ ctx, input }) => {
    const { creatorId, workId, backupName } = input;
    const errorResponse = await deleteBackup(
      creatorId,
      workId,
      ctx.user.id,
      backupName
    );
    if (errorResponse !== null) {
      throw new TRPCError({ code: "BAD_REQUEST", cause: errorResponse });
    }
  }),
});

async function restoreBackup(
  creatorId: string,
  workId: string,
  userId: string,
  backupName: string
) {
  const { work, error } = await findOwnWorkOrError(creatorId, workId, userId);
  if (error !== null) {
    return <ErrorResponse>{
      errors: [error],
    };
  }
  await backupWork(creatorId, workId, work);
  const workDir = path.join(DIRECTORY_NAME_UPLOADS, creatorId, workId);
  const workPath = path.resolve(workDir);
  const backupToRestorePath = path.resolve(
    DIRECTORY_NAME_BACKUPS,
    workDir,
    backupName
  );
  const backupToRestore = work.backups.find((it) => it.name === backupName);
  if (
    backupToRestore === undefined ||
    !(await fsExtra.pathExists(backupToRestorePath))
  ) {
    return <ErrorResponse>{
      errors: [ERROR_MESSAGE_BACKUP_NOT_FOUND],
    };
  }
  await fsExtra.move(backupToRestorePath, workPath);
  work.fileSize = backupToRestore.fileSize;
  work.backups.remove(backupToRestore);
  await work.save();
  return null;
}
async function deleteBackup(
  creatorId: string,
  workId: string,
  userId: string,
  backupName: string
) {
  const { work, error } = await findOwnWorkOrError(creatorId, workId, userId);
  if (error !== null) {
    return <ErrorResponse>{
      errors: [error],
    };
  }
  const backupToDeletePath = path.resolve(
    DIRECTORY_NAME_BACKUPS,
    DIRECTORY_NAME_UPLOADS,
    creatorId,
    workId,
    backupName
  );
  const backupToDelete = work.backups.find((it) => it.name === backupName);
  if (
    backupToDelete === undefined ||
    !(await fsExtra.pathExists(backupToDeletePath))
  ) {
    throw new Error(`バックアップ${backupName}が見つかりませんでした。`);
  }
  await fsExtra.remove(backupToDeletePath);
  work.backups.remove(backupToDelete);
  await work.save();
  return null;
}
