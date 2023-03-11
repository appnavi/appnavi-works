import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ErrorResponse } from "../../../../../common/types";
import { creatorIdSchema, deleteWork, renameWork, workIdSchema } from "../../../../../services/works";
import { WorkError } from "../../../../../utils/errors";
import { authenticatedProcedure, t } from "../../../../../utils/trpc";

const accountWorkProcedure = authenticatedProcedure.input(z.object({
  creatorId: creatorIdSchema,
  workId: workIdSchema
}))

export const accountWorkRouter = t.router({
  rename: accountWorkProcedure.input(z.object({
    renamedCreatorId: creatorIdSchema,
    renamedWorkId: workIdSchema,
  })).mutation(async ({ ctx, input }) => {
    const { creatorId, workId, renamedCreatorId, renamedWorkId } = input;
    try {
      await renameWork(creatorId, workId, ctx.user.id, renamedCreatorId, renamedWorkId)
    } catch (err) {
      if (err instanceof WorkError) {
        const cause: ErrorResponse = {
          errors: [err.message]
        }
        throw new TRPCError({ code: "BAD_REQUEST", cause })
      }
    }
  }),
  delete: accountWorkProcedure.mutation(async ({ ctx, input }) => {
    const { creatorId, workId } = input;
    try {
      await deleteWork(creatorId, workId, ctx.user.id);
    } catch (err) {
      if (err instanceof WorkError) {
        const cause: ErrorResponse = {
          errors: [err.message]
        }
        throw new TRPCError({ code: "BAD_REQUEST", cause })
      }
    }
  })
})