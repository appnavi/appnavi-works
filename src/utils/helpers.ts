import crypto from "crypto";
import fs from "fs";
import path from "path";
import ejs, { Options as EjsOptions } from "ejs";
import express from "express";
import createError from "http-errors";
import { getCsrfTokenFromSession } from "../services/csrf";
import { DIRECTORY_NAME_VIEWS, STATUS_CODE_UNAUTHORIZED } from "./constants";
export const idRegex = /^[0-9a-z-]+$/;

const secretKeys = [
  "DATABASE_URL",
  "SESSION_DATABASE_URL",
  "SLACK_CLIENT_ID",
  "SLACK_CLIENT_SECRET",
  "SLACK_WORKSPACE_ID",
  "COOKIE_SECRET",
  "CSRF_TOKEN_SECRET"
] as const;

type SecretKey = typeof secretKeys[number];

type EnvKey = SecretKey | "SITE_URL" | "WORK_STORAGE_SIZE_BYTES" | "PORT";

function isSecretKey(arg: unknown): arg is SecretKey {
  return (
    typeof arg === "string" && secretKeys.find((s) => s === arg) !== undefined
  );
}

export function getSecret(key: string): string {
  try {
    return fs.readFileSync(`/run/secrets/${key}`, "utf-8");
  } catch {
    throw new Error(`"${key}"がありません。`);
  }
}

export function getEnv(key: EnvKey): string {
  if (isSecretKey(key)) {
    return getSecret(key);
  }
  const val = process.env[key];
  if (typeof val !== "string") {
    throw new Error(`環境変数${key}は存在しません。`);
  }
  return val;
}
export function getEnvNumber(key: "WORK_STORAGE_SIZE_BYTES" | "PORT"): number {
  const env = getEnv(key);
  const envNumber = parseInt(env, 10);
  if (env !== envNumber.toString()) {
    throw new Error(`環境変数${key}は数値に変換できません`);
  }
  return envNumber;
}
export function getSiteURLWithoutTrailingSlash(): string {
  let url = getEnv("SITE_URL");
  if (url.endsWith("/")) {
    url = url.slice(0, -1);
  }
  return url;
}
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
