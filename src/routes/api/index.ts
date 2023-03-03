import { Router } from "express";
import { uploadRouter } from "./upload";

const apiRouter = Router();

apiRouter.use("/upload", uploadRouter);

export { apiRouter };
