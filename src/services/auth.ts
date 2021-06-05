import express from "express";
import jwt from "jsonwebtoken";
import { UserDocument, UserModel } from "../models/database";
import { STATUS_CODE_UNAUTHORIZED } from "../utils/constants";
import { getEnv } from "../utils/helpers";

interface SessionData {
  redirect: { url: string };
  redirectToken: string;
}
function setRedirect(req: express.Request): void {
  // TODO：htmlではない場合はなにもしないように。
  // TODO：req.originalUrlが自サイトではない場合は何もしないように。
  const session = req.session as SessionData;
  session.redirect = {
    url: req.originalUrl,
  };
  session.redirectToken = jwt.sign(
    { url: req.originalUrl },
    getEnv("JWT_SECRET")
  );
}

export function redirect(req: express.Request, res: express.Response): void {
  const session = req.session as SessionData;
  const redirectUrl = session.redirect?.url;
  const token = session.redirectToken;
  if (token && redirectUrl) {
    const decoded = jwt.verify(token, getEnv("JWT_SECRET")) as {
      url: string;
    };
    if (decoded.url === redirectUrl) {
      if (redirectUrl.startsWith("/")) {
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

export async function findOrCreateUser(
  req: express.Request
): Promise<UserDocument> {
  const userId = getUserIdOrThrow(req);
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
  const userDocument = await findOrCreateUser(req);
  return userDocument.defaultCreatorId;
}
export function getUserName(req: express.Request): string {
  return req.user?.name ?? "";
}
export function getUserId(req: express.Request): string | undefined {
  return req.user?.id;
}
export function getUserIdOrThrow(req: express.Request): string {
  const userId = getUserId(req);
  if (userId !== undefined) {
    return userId;
  }
  throw new Error("ユーザーIDを取得できませんでした。");
}

export function getAvatarUrl(req: express.Request): string | undefined {
  return req.user?.avatar_url;
}
