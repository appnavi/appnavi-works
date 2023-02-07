import { z } from "zod";

export function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x != null;
}

export function isError(x: unknown): x is { name: string; message: string } {
  return (
    isObject(x) &&
    typeof x["name"] === "string" &&
    typeof x["message"] === "string"
  );
}
const expressUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["Slack", "Guest"]),
  avatar_url: z.string().optional(),
});

export function isUser(x: unknown): x is Express.User {
  return expressUserSchema.safeParse(x).success;
}

declare module "express-session" {
  interface SessionData {
    csrfToken: string | undefined;
    csrfTokenWithHash: string | undefined;
  }
}
