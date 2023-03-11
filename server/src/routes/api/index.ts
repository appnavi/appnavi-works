import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { Router } from "express";
import { ZodError } from "zod";
import { ErrorResponse } from "../../common/types";
import * as logger from "../../modules/logger";
import { createContext } from "../../utils/trpc";
import { authRouter } from "./auth";
import { trpcRouter } from "./trpc";
import { uploadRouter } from "./upload";

const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/upload", uploadRouter);
apiRouter.use(
  createExpressMiddleware({
    router: trpcRouter,
    createContext,
    onError({ error, path, type, input }) {
      const { code, cause, message, name } = error;
      logger.system.warn(`${code} ${message}`, {
        input,
        path,
        type,
        name,
        cause,
      });
      if (code === "UNAUTHORIZED") {
        error.message = JSON.stringify(<ErrorResponse>{
          errors: ["ログインが必要です"],
        });
        return;
      }
      if (code === "FORBIDDEN") {
        error.message = JSON.stringify(<ErrorResponse>{
          errors: ["許可されていない操作です"],
        });
        return;
      }
      if (code !== "BAD_REQUEST") {
        error.message = JSON.stringify(<ErrorResponse>{
          errors: ["想定外のエラーです"],
        });
        return;
      }
      if (cause instanceof ZodError) {
        const message: ErrorResponse = {
          errors: cause.issues.map((i) => i.message),
        };
        error.message = JSON.stringify(message);
        return;
      }
      if (ErrorResponse.safeParse(cause).success) {
        error.message = JSON.stringify(cause);
        return;
      }
    },
  })
);

export { apiRouter };
