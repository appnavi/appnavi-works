import express from "express";
import { UserModel } from "../models/database";
import { ensureAuthenticated, getDefaultCreatorId } from "../services/auth";
import { creatorIdSchema } from "../services/upload";
import { getContentSecurityPolicy, render } from "../utils/helpers";

const profileRouter = express.Router();
profileRouter.use(getContentSecurityPolicy());

profileRouter.use(ensureAuthenticated);

profileRouter
  .route("/")
  .get(async (req, res) => {
    const defaultCreatorId = await getDefaultCreatorId(req);
    render("profile", req, res, {
      defaultCreatorId: defaultCreatorId,
    });
  })
  .post(
    async (req, res, next) => {
      const defaultCreatorId = (req.body as Record<string, unknown>)[
        "default_creator_id"
      ] as string;
      res.locals.defaultCreatorId = defaultCreatorId;
      try {
        await creatorIdSchema.validate(defaultCreatorId);
      } catch (e) {
        const err = e as { name: string; errors: string[] };
        res.locals.error = err.errors[0];
        next();
        return;
      }
      await UserModel.updateOne(
        {
          userId: req.user?.user.id,
        },
        {
          $set: {
            defaultCreatorId: defaultCreatorId,
          },
        },
        { upsert: true }
      );
      next();
    },
    (req, res) => {
      const error = res.locals.error as string;
      const message = error ?? "設定しました。";
      const defaultCreatorId = res.locals.defaultCreatorId as string;
      render("profile", req, res, {
        message: message,
        defaultCreatorId: defaultCreatorId,
      });
    }
  );

export { profileRouter };
