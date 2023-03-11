import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ErrorResponse } from "../../../../../common/types";
import { creatorIdSchema, deleteBackup, restoreBackup, workIdSchema } from "../../../../../services/works";
import { ERROR_MESSAGE_BACKUP_NAME_INVALID, ERROR_MESSAGE_BACKUP_NAME_REQUIRED } from "../../../../../utils/constants";
import { RestoreBackupError } from "../../../../../utils/errors";
import { authenticatedProcedure, t } from "../../../../../utils/trpc";

const accountBacupProcedure = authenticatedProcedure.input(z.object({
  creatorId: creatorIdSchema,
  workId: workIdSchema,
  backupName: z
    .string({ required_error: ERROR_MESSAGE_BACKUP_NAME_REQUIRED })
    .regex(/^\d+$/, ERROR_MESSAGE_BACKUP_NAME_INVALID)
}))

export const accountBackupRouter = t.router({
  restore: accountBacupProcedure.mutation(async ({ ctx, input }) => {
    const { creatorId, workId, backupName } = input;
    try {
      await restoreBackup(creatorId, workId, ctx.user.id, backupName)
    } catch (err) {
      //TODO：エラーハンドリング修正
      if (err instanceof RestoreBackupError) {
        const cause: ErrorResponse = {
          errors: err.errors.map(x => String(x))
        }
        throw new TRPCError({ code: "BAD_REQUEST", cause })
      }
      throw new TRPCError({ code: "UNAUTHORIZED", cause: err })
    }
  }),
  delete: accountBacupProcedure.mutation(async ({ ctx, input }) => {
    const { creatorId, workId, backupName } = input;
    try {
      await deleteBackup(creatorId, workId, ctx.user.id, backupName);
    } catch (err) {
      //TODO：エラーハンドリング修正
      if (err instanceof RestoreBackupError) {
        const cause: ErrorResponse = {
          errors: err.errors.map(x => String(x))
        }
        throw new TRPCError({ code: "BAD_REQUEST", cause })
      }
      throw new TRPCError({ code: "UNAUTHORIZED", cause: err })
    }
  })
})