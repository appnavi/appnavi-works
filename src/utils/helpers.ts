import crypto from "crypto";
import path from "path";
import ejs, { Options as EjsOptions } from "ejs";
import express from "express";
import createError from "http-errors";
import { DIRECTORY_NAME_VIEWS, STATUS_CODE_UNAUTHORIZED } from "./constants";
export const idRegex = /^[0-9a-z-]+$/;

export const randomStringCharacters =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
export function generateRandomString(
  length: number,
  characters: string | undefined = undefined
): string {
  // 引用：https://qiita.com/fukasawah/items/db7f0405564bdc37820e
  const S = characters ?? randomStringCharacters;
  return Array.from(crypto.randomFillSync(new Uint8Array(length)))
    .map((n) => S[n % S.length])
    .join("");
}

export const ignoreTypescriptFile = (
  req: express.Request,
  _res: express.Response,
  next: express.NextFunction
): void => {
  if (req.url.endsWith(".ts")) {
    next(createError(404));
  }
  next();
};

export const slackUserOnly = (
  req: express.Request,
  _res: express.Response,
  next: express.NextFunction
): void => {
  const userType = req.user?.type;
  if (userType !== "Slack") {
    next(createError(STATUS_CODE_UNAUTHORIZED));
    return;
  }
  next();
};

export function render(
  view: string,
  req: express.Request,
  res: express.Response,
  options: Record<string, unknown> = {}
): void {
  res.render(view, {
    user: req.user,
    csrfToken: req.session.csrfToken,
    ...options,
  });
}

export function ejsToHtml(
  filePath: string,
  options: Record<string, unknown>,
  ejsOptions: EjsOptions = {}
): Promise<string> {
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
): (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => void {
  return (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    asyncHandler(req, res, next).catch(next);
  };
}
