import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { Router } from "express";
import { ZodError } from "zod";
import { ErrorResponse } from "../../common/types";
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
    onError({ error }) {
      const { cause } = error;
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
