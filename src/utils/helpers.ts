import crypto from "crypto";
import fs from "fs";
import path from "path";
import ejs, { Options as EjsOptions } from "ejs";
import express from "express";
import createError from "http-errors";
import { DIRECTORY_NAME_VIEWS, STATUS_CODE_UNAUTHORIZED } from "./constants";
export const idRegex = /^[0-9a-z-]+$/;

const secretKeys = [
  "DATABASE_URL",
  "SLACK_CLIENT_ID",
  "SLACK_CLIENT_SECRET",
  "SLACK_WORKSPACE_ID",
  "COOKIE_NAME",
  "COOKIE_KEYS",
  "JWT_SECRET",
  "COOKIE_SECRET",
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

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x != null;
}

export function isSlackUser(user: unknown): user is SlackUser {
  if (!isObject(user)) return false;
  if (typeof user["ok"] !== "boolean") return false;
  if (typeof user["https://slack.com/user_id"] !== "string") return false;
  if (typeof user["https://slack.com/team_id"] !== "string") return false;
  if (typeof user["https://slack.com/team_name"] !== "string") return false;
  if (typeof user["https://slack.com/team_domain"] !== "string") return false;
  if (typeof user["https://slack.com/user_image_24"] !== "string") return false;
  if (typeof user["https://slack.com/user_image_32"] !== "string") return false;
  if (typeof user["https://slack.com/user_image_48"] !== "string") return false;
  if (typeof user["https://slack.com/user_image_72"] !== "string") return false;
  if (typeof user["https://slack.com/user_image_192"] !== "string")
    return false;
  if (typeof user["https://slack.com/user_image_512"] !== "string")
    return false;
  if (typeof user["https://slack.com/user_image_1024"] !== "string")
    return false;
  if (typeof user["https://slack.com/team_image_34"] !== "string") return false;
  if (typeof user["https://slack.com/team_image_44"] !== "string") return false;
  if (typeof user["https://slack.com/team_image_68"] !== "string") return false;
  if (typeof user["https://slack.com/team_image_88"] !== "string") return false;
  if (typeof user["https://slack.com/team_image_102"] !== "string")
    return false;
  if (typeof user["https://slack.com/team_image_132"] !== "string")
    return false;
  if (typeof user["https://slack.com/team_image_230"] !== "string")
    return false;
  if (typeof user["https://slack.com/team_image_default"] !== "boolean")
    return false;
  return true;
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
  const csrfToken =
    typeof req.csrfToken !== "undefined" ? req.csrfToken() : undefined;
  res.render(view, {
    user: req.user,
    csrfToken,
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
