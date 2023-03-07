import { z } from "zod";
export const User = z.object({
  id: z.string(),
  name: z.string(),
  avatar_url: z.string().url().optional(),
  type: z.enum(["Slack", "Guest"]),
})
export type User = z.infer<typeof User>
export const UserOrUndefined = User.optional()
export type UserOrUndefined = z.infer<typeof UserOrUndefined>