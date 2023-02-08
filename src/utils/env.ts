import fs from "fs";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

// Inspired by https://github.com/t3-oss/create-t3-app

const nonSecretEnvKeys = [
  "SITE_URL",
  "WORK_STORAGE_SIZE_BYTES",
  "PORT",
  "NODE_ENV",
] as const;
const secretEnvKeys = [
  "DATABASE_URL",
  "SESSION_DATABASE_URL",
  "SLACK_CLIENT_ID",
  "SLACK_CLIENT_SECRET",
  "SLACK_WORKSPACE_ID",
  "COOKIE_SECRET",
  "CSRF_TOKEN_SECRET",
] as const;

const nonSecretEnvsSchema = z.object({
  SITE_URL: z.string().url(),
  WORK_STORAGE_SIZE_BYTES: z.coerce.number().nonnegative(),
  PORT: z.coerce.number().nonnegative(),
  NODE_ENV: z.enum(["development", "production", "test"]),
});

const secretEnvsSchema = z.object({
  DATABASE_URL: z.string().url(),
  SESSION_DATABASE_URL: z.string().url(),
  SLACK_CLIENT_ID: z.string(),
  SLACK_CLIENT_SECRET: z.string(),
  SLACK_WORKSPACE_ID: z.string(),
  COOKIE_SECRET: z.string(),
  CSRF_TOKEN_SECRET: z.string(),
});

const nonSecretEnvsParsed = nonSecretEnvsSchema.safeParse(
  Object.fromEntries(nonSecretEnvKeys.map((key) => [key, process.env[key]]))
);
if (!nonSecretEnvsParsed.success) {
  throw fromZodError(nonSecretEnvsParsed.error);
}

const secretEnvsSchemaParsed = secretEnvsSchema.safeParse(
  Object.fromEntries(secretEnvKeys.map((key) => [key, getSecret(key)]))
);
if (!secretEnvsSchemaParsed.success) {
  throw fromZodError(secretEnvsSchemaParsed.error);
}

export const env = {
  ...nonSecretEnvsParsed.data,
  ...secretEnvsSchemaParsed.data,
};

export function getSecret(key: string): string {
  try {
    return fs.readFileSync(`/run/secrets/${key}`, "utf-8");
  } catch {
    throw new Error(`"${key}"がありません。`);
  }
}

export function getSiteURLWithoutTrailingSlash(): string {
  let url = env.SITE_URL;
  if (url.endsWith("/")) {
    url = url.slice(0, -1);
  }
  return url;
}
