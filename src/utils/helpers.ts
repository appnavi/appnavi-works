import path from "path";
import ejs, { Options as EjsOptions } from "ejs";
import express from "express";
import helmet from "helmet";
import createError from "http-errors";
import { DIRECTORY_NAME_VIEWS } from "./constants";

type EnvKey =
  | "SLACK_CLIENT_ID"
  | "SLACK_CLIENT_SECRET"
  | "SLACK_REDIRECT_URI"
  | "SLACK_WORKSPACE_ID"
  | "COOKIE_NAME"
  | "COOKIE_KEYS"
  | "JWT_SECRET"
  | "DATABASE_URL"
  | "SITE_URL"
  | "GAME_STORAGE_SIZE_BYTES"
  | "PORT";
export function getEnv(key: EnvKey): string {
  const val = process.env[key];
  if (typeof val !== "string") {
    throw new Error(`環境変数${key}は存在しません。`);
  }
  return val;
}
export function getEnvNumber(key: "GAME_STORAGE_SIZE_BYTES" | "PORT"): number {
  const env = getEnv(key);
  const envNumber = parseInt(env, 10);
  if (env !== envNumber.toString()) {
    throw new Error(`環境変数${key}は数値に変換できません`);
  }
  return envNumber;
}
export function getContentSecurityPolicy(
  directives: Record<string, Iterable<string>> = {}
): (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => void {
  return helmet.contentSecurityPolicy({
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "script-src": [
        "'self'",
        "https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js",
        "https://code.jquery.com/jquery-3.5.1.min.js",
      ],
      "img-src": [
        "'self'",
        "secure.gravatar.com",
        "i0.wp.com",
        "https://avatars.slack-edge.com",
      ],
      ...directives,
    },
  });
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

export function render(
  view: string,
  req: express.Request,
  res: express.Response,
  options: Record<string, unknown> = {}
): void {
  res.render(view, {
    user: req.user?.user,
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
