import express from "express";
import { User } from "../../common/types";
import { UserModel } from "../../models/database";
import { STATUS_CODE_UNAUTHORIZED } from "../../utils/constants";

export function ensureAuthenticated(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  if (isAuthenticated(req)) {
    next();
    return;
  }
  if (req.method === "GET") {
    res.redirect("/auth");
    return;
  }
  res.status(STATUS_CODE_UNAUTHORIZED).end();
}

export function isAuthenticated(req: express.Request) {
  return req.user !== undefined;
}

export async function findUserOrThrow(userId: string) {
  const users = await UserModel.find({
    userId,
  });
  switch (users.length) {
    case 0:
      throw new Error("存在しないユーザーです");
    case 1:
      return users[0];
    default:
      throw new Error("同じユーザーが複数登録されています");
  }
}

export async function findOrCreateUser(userId: string) {
  const users = await UserModel.find({
    userId,
  });
  switch (users.length) {
    case 0:
      return await UserModel.create({ userId });
    case 1:
      return users[0];
    default:
      throw new Error("同じユーザーが複数登録されています");
  }
}

export function getUserIdOrThrow(req: express.Request) {
  const parsed = User.safeParse(req.user);
  if (parsed.success) {
    return parsed.data.id;
  }
  throw new Error("ユーザーIDを取得できませんでした。");
}

export async function updateCreatorIds(userId: string, creatorId: string) {
  const user = await findOrCreateUser(userId);
  if (!user.creatorIds.includes(creatorId)) {
    user.creatorIds.push(creatorId);
  }
  await user.save();
}

export async function logLastLogin(
  req: express.Request,
  _res: express.Response,
  next: express.NextFunction,
) {
  const userDocument = await findOrCreateUser(getUserIdOrThrow(req));
  await userDocument.updateOne({
    $set: {
      lastLogIn: new Date(),
    },
  });
  next();
}
