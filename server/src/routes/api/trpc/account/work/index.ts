import path from "path";
import { TRPCError } from "@trpc/server";
import fsExtra from "fs-extra";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { WorkDB } from "../../../../../common/types";
import { WorkModel } from "../../../../../models/database";
import { updateCreatorIds } from "../../../../../services/auth";
import {
  creatorIdSchema,
  findOwnWorkOrError,
  getAbsolutePathOfAllBackups,
  getAbsolutePathOfWork,
  isCreatorIdUsedByOtherUser,
  workIdSchema,
} from "../../../../../services/works";
import {
  ERROR_MESSAGE_CREATOR_ID_USED_BY_OTHER_USER,
  ERROR_MESSAGE_RENAME_TO_EXISTING,
  ERROR_MESSAGE_RENAME_TO_SAME,
} from "../../../../../utils/constants";
import { authenticatedProcedure, t } from "../../../../../utils/trpc";

const modifyWorkProcedure = authenticatedProcedure.input(
  z.object({
    creatorId: creatorIdSchema,
    workId: workIdSchema,
  })
);

const WorksDB = WorkDB.array();

export const accountWorkRouter = t.router({
  list: authenticatedProcedure.query(async ({ ctx }) => {
    const myWorks = await WorkModel.find({
      owner: ctx.user.id,
    });
    const parsed = WorksDB.safeParse(myWorks);
    if (parsed.success) {
      return parsed.data;
    }
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      cause: fromZodError(parsed.error),
    });
  }),
  rename: modifyWorkProcedure
    .input(
      z.object({
        renamedCreatorId: creatorIdSchema,
        renamedWorkId: workIdSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { creatorId, workId, renamedCreatorId, renamedWorkId } = input;
      const errorMessage = await renameWork(
        creatorId,
        workId,
        ctx.user.id,
        renamedCreatorId,
        renamedWorkId
      );
      if (errorMessage !== null) {
        throw new TRPCError({ code: "BAD_REQUEST", message: errorMessage });
      }
    }),
  delete: modifyWorkProcedure.mutation(async ({ ctx, input }) => {
    const { creatorId, workId } = input;
    const errorMessage = await deleteWork(creatorId, workId, ctx.user.id);
    if (errorMessage !== null) {
      throw new TRPCError({ code: "BAD_REQUEST", message: errorMessage });
    }
  }),
});

async function deleteWork(creatorId: string, workId: string, userId: string) {
  const { work, error } = await findOwnWorkOrError(creatorId, workId, userId);
  if (error !== null) {
    return error;
  }
  const workDir = getAbsolutePathOfWork(creatorId, workId);
  const backupPath = getAbsolutePathOfAllBackups(creatorId, workId);
  await fsExtra.rm(path.resolve(workDir), { recursive: true, force: true });
  await fsExtra.rm(backupPath, { recursive: true, force: true });
  await work.delete();
  return null;
}

async function renameWork(
  creatorId: string,
  workId: string,
  userId: string,
  renamedCreatorId: string,
  renamedWorkId: string
) {
  if (creatorId === renamedCreatorId && workId === renamedWorkId) {
    return ERROR_MESSAGE_RENAME_TO_SAME;
  }
  const { work, error } = await findOwnWorkOrError(creatorId, workId, userId);
  if (error !== null) {
    return error;
  }
  const workDir = getAbsolutePathOfWork(creatorId, workId);
  const backupPath = getAbsolutePathOfAllBackups(creatorId, workId);
  const renamedWorks = await WorkModel.find({
    creatorId: renamedCreatorId,
    workId: renamedWorkId,
  });
  if (renamedWorks.length > 0) {
    return ERROR_MESSAGE_RENAME_TO_EXISTING;
  }
  const isUsedByOtherUser = await isCreatorIdUsedByOtherUser(
    renamedCreatorId,
    userId
  );
  if (isUsedByOtherUser) {
    return ERROR_MESSAGE_CREATOR_ID_USED_BY_OTHER_USER;
  }
  const renamedPath = getAbsolutePathOfWork(renamedCreatorId, renamedWorkId);
  await fsExtra.ensureDir(path.resolve(renamedPath, ".."));
  await fsExtra.move(path.resolve(workDir), renamedPath);
  if (await fsExtra.pathExists(backupPath)) {
    const renamedBackupPath = getAbsolutePathOfAllBackups(
      renamedCreatorId,
      renamedWorkId
    );
    await fsExtra.ensureDir(path.resolve(renamedBackupPath, ".."));
    await fsExtra.move(backupPath, renamedBackupPath);
  }
  if (work.creatorId !== renamedCreatorId) {
    await updateCreatorIds(userId, renamedCreatorId);
  }
  work.creatorId = renamedCreatorId;
  work.workId = renamedWorkId;
  await work.save();
  return null;
}
