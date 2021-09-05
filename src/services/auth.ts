import express from "express";
import jwt from "jsonwebtoken";
import { UserDocument, UserModel } from "../models/database";
import { STATUS_CODE_UNAUTHORIZED } from "../utils/constants";
import { getEnv } from "../utils/helpers";
declare module "express-session" {
  interface SessionData {
    redirect: { url: string };
    redirectToken: string;
  }
}
function isValidRedirectUrl(redirectUrl: string): boolean {
  if (!redirectUrl.startsWith("/")) {
    return false;
  }
  if (redirectUrl.includes(".")) {
    return false;
  }
  return true;
}

function setRedirect(req: express.Request): void {
  const redirectUrl = req.originalUrl;
  if (!isValidRedirectUrl(redirectUrl)) {
    return;
  }
  const session = req.session;
  session.redirect = {
    url: redirectUrl,
  };
  session.redirectToken = jwt.sign(
    { url: req.originalUrl },
    getEnv("JWT_SECRET")
  );
}

export function redirect(req: express.Request, res: express.Response): void {
  const session = req.session;
  const redirectUrl = session.redirect?.url;
  const token = session.redirectToken;
  if (token && redirectUrl) {
    const decoded = jwt.verify(token, getEnv("JWT_SECRET")) as {
      url: string;
    };
    if (decoded.url === redirectUrl) {
      if (isValidRedirectUrl(redirectUrl)) {
        res.redirect(redirectUrl);
        return;
      }
    }
  }
  res.redirect("/");
}
export function ensureAuthenticated(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  if (isAuthenticated(req)) {
    next();
    return;
  }
  if (req.method === "GET") {
    setRedirect(req);
    res.redirect("/auth");
    return;
  }
  res.status(STATUS_CODE_UNAUTHORIZED).end();
}

export function isAuthenticated(req: express.Request): boolean {
  return req.user !== undefined;
}

export async function findOrCreateUser(userId: string): Promise<UserDocument> {
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

export function getUserIdOrThrow(req: express.Request): string {
  const userId = req.user?.id;
  if (userId !== undefined) {
    return userId;
  }
  throw new Error("ユーザーIDを取得できませんでした。");
}

export async function updateCreatorIds(
  userId: string,
  creatorId: string
): Promise<void> {
  const user = await findOrCreateUser(userId);
  if (!user.creatorIds.includes(creatorId)) {
    user.creatorIds.push(creatorId);
  }
  await user.save();
}
