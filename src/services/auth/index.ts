import express from "express";
import { UserDocument, UserModel } from "../../models/database";
import { system } from "../../modules/logger";
import { STATUS_CODE_UNAUTHORIZED } from "../../utils/constants";

export function ensureAuthenticated(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
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

export async function getDefaultCreatorId(
  req: express.Request
): Promise<string | undefined> {
  const userDocument = await findOrCreateUser(getUserIdOrThrow(req));
  return userDocument.defaultCreatorId;
}

export function getUserIdOrThrow(req: express.Request) {
  const userId = req.user?.id;
  if (userId !== undefined) {
    return userId;
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
  next: express.NextFunction
) {
  const userDocument = await findOrCreateUser(getUserIdOrThrow(req));
  await userDocument.updateOne({
    $set: {
      lastLogIn: new Date(),
    },
  });
  next();
}

export function afterGuestLogIn(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const user = req.user;
  if (user === undefined) {
    system.error(`ログインできていません。`, req.user);
    res.redirect("/auth/error");
    return;
  }
  if (user.type !== "Guest") {
    system.error(`ゲストログインではありません。`, req.user);
    res.redirect("/auth/error");
    return;
  }
  next();
}

export function afterSlackLogin(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const user = req.user;
  if (user === undefined) {
    system.error(`ログインできていません。`, req.user);
    res.redirect("/auth/error");
    return;
  }
  if (user.type !== "Slack") {
    system.error(`Slackによるログインではありません。`, req.user);
    res.redirect("/auth/error");
    return;
  }
  system.info(`ユーザー${user.id}がSlack認証でログインしました。`);
  next();
}
