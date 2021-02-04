import express from "express";
import jwt from "jsonwebtoken";
import { Document } from "mongoose";
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
async function findUser(req: express.Request): Promise<Document | undefined> {
  const user = req.user as { user: { id: string } };
  const results = await new Promise<Document[]>((resolve, reject) => {
    User.find(
      {
        userId: user.user.id,
      },
      (err, data) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(data);
      }
    );
  });
  switch (results.length) {
    case 0:
      return undefined;
    case 1:
      return results[0];
    default:
      throw new Error("同じユーザーが複数登録されています");
  }
}
async function getDefaultAuthorId(
  req: express.Request
): Promise<string | undefined> {
  const userDocument = await findUser(req);
  const userData = userDocument?.toObject() as Record<string, unknown>;
  return userData?.defaultAuthorId as string;
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

export {
  ensureAuthenticated,
  isAuthenticated,
  redirect,
  findUser,
  getDefaultAuthorId,
};
