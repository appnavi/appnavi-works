import express from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/database";
import { getEnv } from "../utils/helpers";

interface SessionData {
  redirect: { url: string };
  redirectToken: string;
}
function setRedirect(req: express.Request): void {
  const session = req.session as SessionData;
  session.redirect = {
    url: req.originalUrl,
  };
  session.redirectToken = jwt.sign(
    { url: req.originalUrl },
    getEnv("JWT_SECRET")
  );
}
async function findUser(
  req: express.Request
): Promise<NodeJS.Dict<unknown> | undefined> {
  const user = req.user as { user: { id: string } };
  const users = (await User.find()) as NodeJS.Dict<unknown>[];
  const userData = users.filter((u) => u["id"] == user.user.id);
  switch (userData.length) {
    case 0:
      return undefined;
    case 1:
      return userData[0];
    default:
      throw new Error(
        `ユーザー${user.user.id}のデータがデータベースに複数存在します。`
      );
  }
}

function redirect(req: express.Request, res: express.Response): void {
  const session = req.session as SessionData;
  const rediretUrl = session.redirect?.url;
  const token = session.redirectToken;
  if (token && rediretUrl) {
    const decoded = jwt.verify(token, getEnv("JWT_SECRET")) as {
      url: string;
    };
    if (decoded.url === rediretUrl) {
      if (rediretUrl.startsWith("/")) {
        res.redirect(rediretUrl);
        return;
      }
    }
  }
  res.redirect("/");
}
function ensureAuthenticated(
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
  res.status(401).end();
}

function isAuthenticated(req: express.Request): boolean {
  return req.user !== undefined;
}

export { ensureAuthenticated, isAuthenticated, redirect, findUser };
