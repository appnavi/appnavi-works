import express from "express";
import jwt from "jsonwebtoken";

declare module "express-session" {
  interface SessionData {
    token: string,
    oauth: {accessToken: string}
  }
}

function ensureAuthenticated(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  if (isLogIn(req)) {
    next();
    return;
  }
  res.redirect("/auth");
}

function isLogIn(req: express.Request): boolean {
  const token = req.session.token;
  const accessToken = req.session.oauth?.accessToken;
  if (token == null || accessToken == null) {
    return false;
  }
  const decoded: any = jwt.verify(token, process.env["JWT_SECRET"]!);
  return decoded["accessToken"] === accessToken;
}
export { ensureAuthenticated, isLogIn };
