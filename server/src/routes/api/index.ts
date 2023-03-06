import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { Router } from "express";
import { accountRouter } from "./account";
import { trpcRouter } from "./trpc";
import { uploadRouter } from "./upload";



const apiRouter = Router();

apiRouter.use("/account", accountRouter);
apiRouter.use("/upload", uploadRouter);
apiRouter.use(createExpressMiddleware({ router: trpcRouter }))

export { apiRouter };