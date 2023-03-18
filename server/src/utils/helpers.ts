import crypto from "crypto";
import path from "path";
import ejs, { Options as EjsOptions } from "ejs";
import express from "express";
import { DIRECTORY_NAME_VIEWS } from "./constants";
import { UnauthorizedError } from "./errors";

export const randomStringCharacters =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
export function generateRandomString(
  length: number,
  characters: string | undefined = undefined
) {
  // 引用：https://qiita.com/fukasawah/items/db7f0405564bdc37820e
  const S = characters ?? randomStringCharacters;
  return Array.from(crypto.randomFillSync(new Uint8Array(length)))
    .map((n) => S[n % S.length])
    .join("");
}

export const slackUserOnly = (
  req: express.Request,
  _res: express.Response,
  next: express.NextFunction
) => {
  const userType = req.user?.type;
  if (userType !== "Slack") {
    next(new UnauthorizedError());
    return;
  }
  next();
};

export function render(
  view: string,
  req: express.Request,
  res: express.Response,
  options: Record<string, unknown> = {}
) {
  res.render(view, {
    user: req.user,
    ...options,
  });
}

export function ejsToHtml(
  filePath: string,
  options: Record<string, unknown>,
  ejsOptions: EjsOptions = {}
) {
  return ejs.renderFile(filePath, options, {
    views: [path.resolve(DIRECTORY_NAME_VIEWS)],
    ...ejsOptions,
  });
}

// http://expressjs.com/en/advanced/best-practice-performance.html#use-promises
export function wrap(
  asyncHandler: (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => Promise<void>
) {
  return (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    asyncHandler(req, res, next).catch(next);
  };
}
export function middlewareToPromise(
  middleware: (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => void,
  req: express.Request,
  res: express.Response
) {
  return new Promise<void>((resolve, reject) => {
    middleware(req, res, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
