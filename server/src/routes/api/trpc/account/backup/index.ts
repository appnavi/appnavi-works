import { TRPCError } from "@trpc/server";
import fsExtra from "fs-extra";
import { z } from "zod";
import {
  backupWork,
  creatorIdSchema,
  findOwnWorkOrError,
  getAbsolutePathOfBackup,
  getAbsolutePathOfWork,
  workIdSchema,
} from "../../../../../services/works";
import {
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
    const errorMessage = await restoreBackup(
      creatorId,
      workId,
      ctx.user.id,
      backupName
    );
    if (errorMessage !== null) {
      throw new TRPCError({ code: "BAD_REQUEST", message: errorMessage });
    }
  }),
  delete: accountBackupProcedure.mutation(async ({ ctx, input }) => {
    const { creatorId, workId, backupName } = input;
    const errorMessage = await deleteBackup(
      creatorId,
      workId,
      ctx.user.id,
      backupName
    );
    if (errorMessage !== null) {
      throw new TRPCError({ code: "BAD_REQUEST", message: errorMessage });
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
    return error;
  }
  const workPath = getAbsolutePathOfWork(creatorId, workId);
  const backupToRestorePath = getAbsolutePathOfBackup(
    creatorId,
    workId,
    backupName
  );
  const backupToRestore = work.backups.find((it) => it.name === backupName);
  if (
    backupToRestore === undefined ||
    !(await fsExtra.pathExists(backupToRestorePath))
  ) {
    return ERROR_MESSAGE_BACKUP_NOT_FOUND;
  }
  await backupWork(creatorId, workId, work);
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
    return error;
  }
  const backupToDeletePath = getAbsolutePathOfBackup(
    creatorId,
    workId,
    backupName
  );
  const backupToDelete = work.backups.find((it) => it.name === backupName);
  if (
    backupToDelete === undefined ||
    !(await fsExtra.pathExists(backupToDeletePath))
  ) {
    return ERROR_MESSAGE_BACKUP_NOT_FOUND;
  }
  await fsExtra.remove(backupToDeletePath);
  work.backups.remove(backupToDelete);
  await work.save();
  return null;
}
