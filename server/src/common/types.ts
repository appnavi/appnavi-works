import { z } from "zod";
export const User = z.object({
  id: z.string(),
  name: z.string(),
  avatar_url: z.string().url(),
  type: z.enum(["Slack", "Guest"]),
})