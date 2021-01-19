import express from "express";
import jwt from "jsonwebtoken";
import { getEnv } from "../helpers";
declare module "express-session" {
  interface SessionData {
    token: string;
    oauth: { accessToken: string };
    redirect: { url: string };
    redirectToken: string;
  }
}
function setRedirect(req: express.Request): void {
  req.session.redirect = {
    url: req.originalUrl,
  };
  req.session.redirectToken = jwt.sign(
    { url: req.originalUrl },
    getEnv("JWT_SECRET")
  );
}

function redirect(req: express.Request, res: express.Response): void {
  const rediretUrl = req.session.redirect?.url;
  const token = req.session.redirectToken;
  if (token && rediretUrl) {
    const decoded = jwt.verify(token, getEnv("JWT_SECRET")) as {
      url: string;
    };
    if (decoded.url === rediretUrl) {
      res.redirect(rediretUrl);
      return;
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
  const token = req.session.token;
  const accessToken = req.session.oauth?.accessToken;
  if (token == null || accessToken == null) {
    return false;
  }
  const decoded = jwt.verify(token, getEnv("JWT_SECRET")) as {
    accessToken: string;
  };
  return decoded.accessToken === accessToken;
}

export { ensureAuthenticated, isAuthenticated, redirect };
