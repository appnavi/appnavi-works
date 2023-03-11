import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { ErrorResponse, WorkDB } from "../../../../../common/types";
import { WorkModel } from "../../../../../models/database";
import {
  creatorIdSchema,
  deleteWork,
  renameWork,
  workIdSchema,
} from "../../../../../services/works";
import { WorkError } from "../../../../../utils/errors";
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
      try {
        await renameWork(
          creatorId,
          workId,
          ctx.user.id,
          renamedCreatorId,
          renamedWorkId
        );
      } catch (err) {
        if (err instanceof WorkError) {
          const cause: ErrorResponse = {
            errors: [err.message],
          };
          throw new TRPCError({ code: "BAD_REQUEST", cause });
        }
      }
    }),
  delete: modifyWorkProcedure.mutation(async ({ ctx, input }) => {
    const { creatorId, workId } = input;
    try {
      await deleteWork(creatorId, workId, ctx.user.id);
    } catch (err) {
      if (err instanceof WorkError) {
        const cause: ErrorResponse = {
          errors: [err.message],
        };
        throw new TRPCError({ code: "BAD_REQUEST", cause });
      }
    }
  }),
});
