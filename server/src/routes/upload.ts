import express from "express";
import { ensureAuthenticated, getDefaultCreatorId } from "../services/auth";
import { getSiteURLWithoutTrailingSlash } from "../utils/env";
import { render, wrap } from "../utils/helpers";

const uploadRouter = express.Router();
uploadRouter.use(ensureAuthenticated);

uploadRouter.get(
  "/unity",
  wrap(async function (req, res) {
    render("upload/unity", req, res, {
      defaultCreatorId: await getDefaultCreatorId(req),
      url: getSiteURLWithoutTrailingSlash(),
    });
  })
);

export { uploadRouter };
