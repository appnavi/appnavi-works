import express from "express";
import { UserModel } from "../../models/database";
import { getUserIdOrThrow } from "../../services/auth";
import { hashPassword } from "../../services/auth/password";
import {
  generateRandomString,
  render,
  slackUserOnly,
  wrap,
} from "../../utils/helpers";

const guestRouter = express.Router();
guestRouter.use(slackUserOnly);
guestRouter.get(
  "/",
  wrap(async (req, res) => {
    const userId = getUserIdOrThrow(req);
    const guests = await UserModel.find({
      "guest.createdBy": {
        $eq: userId,
      },
    });
    render("account/guest", req, res, { guests });
  })
);

//TODO：React導入後に api へ移動
guestRouter.post(
  "/create",
  wrap(async (req, res) => {
    let guestUserId: string | undefined;
    for (;;) {
      guestUserId = `guest-${generateRandomString(6)}`;
      const users = await UserModel.find({ userId: guestUserId });
      if (users.length == 0) {
        break;
      }
    }
    const password = generateRandomString(16);
    const hashedPassword = await hashPassword(password);
    await UserModel.create({
      userId: guestUserId,
      guest: {
        hashedPassword,
        createdBy: req.user?.id,
      },
    });
    render("account/guest/create", req, res, {
      guestUserId,
      password,
    });
  })
);

export { guestRouter };
