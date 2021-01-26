import express from "express";
import jwt from "jsonwebtoken";
import { getEnv } from "../helpers";

interface SessionData {
  redirect: { url: string };
  redirectToken: string;
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

export { ensureAuthenticated, isAuthenticated, redirect };
