import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { Router } from "express";
import { ZodError } from "zod";
import * as logger from "../../modules/logger";
import { generateToken } from "../../services/csrf";
import { createContext } from "../../utils/trpc";
import { authRouter } from "./auth";
import { trpcRouter } from "./trpc";
import { uploadRouter } from "./upload";

const apiRouter = Router();

apiRouter.get("/csrf", (req, res) => {
  const csrfToken = generateToken(res, req);
  res.send(csrfToken);
});

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
        error.message = "ログインが必要です";
        return;
      }
      if (code === "FORBIDDEN") {
        error.message = "許可されていない操作です";
        return;
      }
      if (code !== "BAD_REQUEST") {
        error.message = "想定外のエラーです";
        return;
      }
      if (cause instanceof ZodError) {
        error.message = cause.issues.map((x) => x.message).join("\n");
        return;
      }
    },
  }),
);

export { apiRouter };
