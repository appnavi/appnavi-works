import express from "express";
import jwt from "jsonwebtoken";
import { UserDocument, UserModel } from "../models/database";
import { system } from "../modules/logger";
import { STATUS_CODE_UNAUTHORIZED } from "../utils/constants";
import { getEnv, isObject, isError } from "../utils/helpers";
interface RedirectData {
  url: string;
}
function isRedirectData(x: unknown): x is RedirectData {
  if (!isObject(x)) return false;
  if (typeof x["url"] !== "string") return false;
  return true;
}
declare module "express-session" {
  interface SessionData {
    redirect: RedirectData;
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
  if (typeof token !== "string" || typeof redirectUrl !== "string") {
    res.redirect("/");
    return;
  }
  try {
    const decoded = jwt.verify(token, getEnv("JWT_SECRET"));
    if (
      isRedirectData(decoded) &&
      decoded.url === redirectUrl &&
      isValidRedirectUrl(redirectUrl)
    ) {
      res.redirect(redirectUrl);
      return;
    } else {
      system.error(
        "リダイレクトのデータが不正です。",
        decoded,
        session.redirect,
        session.redirectToken
      );
    }
  } catch (e) {
    let message = "JWT処理で不明なエラーが発生しました。";
    if (
      isError(e) &&
      e.name === "JsonWebTokenError" &&
      e.message === "invalid signature"
    ) {
      message = "JWTが改変されています";
    }
    system.error(message, token, e);
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

export async function findUserOrThrow(userId: string): Promise<UserDocument> {
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
