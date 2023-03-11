import express from "express";
import {
  ensureAuthenticated,
} from "../../services/auth";
import { guestRouter } from "./guest";

const accountRouter = express.Router();

accountRouter.use(ensureAuthenticated);

accountRouter.use("/guest", guestRouter);

export { accountRouter };
