import express from "express";
import jwt from "jsonwebtoken";

declare module "express-session" {
  interface SessionData {
    token: string;
    oauth: { accessToken: string };
    redirect: { url: string };
    redirectToken: string;
  }
}
function setRedirect(req: express.Request) {
  req.session.redirect = {
    url: req.originalUrl,
  };
  req.session.redirectToken = jwt.sign(
    { url: req.originalUrl },
    process.env["JWT_SECRET"]!
  );
}

function redirect(req: express.Request, res: express.Response) {
  const rediretUrl = req.session.redirect?.url;
  const token = req.session.redirectToken;
  if (token && rediretUrl) {
    const decoded: any = jwt.verify(token, process.env["JWT_SECRET"]!);
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
) {
  if (isAuthenticated(req)) {
    next();
    return;
  }
  setRedirect(req);
  res.redirect("/auth");
}

function isAuthenticated(req: express.Request): boolean {
  const token = req.session.token;
  const accessToken = req.session.oauth?.accessToken;
  if (token == null || accessToken == null) {
    return false;
  }
  const decoded: any = jwt.verify(token, process.env["JWT_SECRET"]!);
  return decoded["accessToken"] === accessToken;
}

export { ensureAuthenticated, isAuthenticated, redirect };
