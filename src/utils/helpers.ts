import express from "express";
import helmet from "helmet";

type EnvKey =
  | "SLACK_CLIENT_ID"
  | "SLACK_CLIENT_SECRET"
  | "SLACK_REDIRECT_URI"
  | "SLACK_WORKSPACE_ID"
  | "COOKIE_NAME"
  | "COOKIE_KEYS"
  | "JWT_SECRET"
  | "DATABASE_URL";
function getEnv(key: EnvKey): string {
  const val = process.env[key];
  if (typeof val !== "string") {
    throw new Error(`環境変数${key}は存在しません。`);
  }
  return val;
}
function getContentSecurityPolicy(
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
      ...directives,
    },
  });
}
export { getEnv, getContentSecurityPolicy };
