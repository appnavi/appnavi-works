import { z } from "zod";

const expressUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["Slack", "Guest"]),
  avatar_url: z.string().optional(),
});

export function isUser(x: unknown): x is Express.User {
  return expressUserSchema.safeParse(x).success;
}
