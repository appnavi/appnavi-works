import { Router } from "express";
import { accountRouter } from "./account";
import { uploadRouter } from "./upload";

const apiRouter = Router();

apiRouter.use("/account", accountRouter);
apiRouter.use("/upload", uploadRouter);

export { apiRouter };
