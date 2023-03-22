import { z } from "zod";
export const User = z.object({
  id: z.string(),
  name: z.string(),
  avatar_url: z.string().url().optional(),
  type: z.enum(["Slack", "Guest"]),
});
export type User = z.infer<typeof User>;
export const UserOrUndefined = User.optional();
export type UserOrUndefined = z.infer<typeof UserOrUndefined>;

export const UserDB = z
  .object({
    userId: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
    lastLogIn: z.date().optional(),
    defaultCreatorId: z.string().optional(),
    creatorIds: z.string().array(),
    guest: z
      .object({
        hashedPassword: z.string(),
        createdBy: z.string(),
      })
      .optional(),
  })
  .transform((user) => {
    const { guest } = user;
    let newGuest = undefined;
    if (guest !== undefined) {
      newGuest = {
        createdBy: guest.createdBy,
      };
    }
    return {
      ...user,
      guest: newGuest,
    };
  });
export type UserDB = z.infer<typeof UserDB>;

export const WorkDB = z.object({
  creatorId: z.string(),
  workId: z.string(),
  owner: z.string(),
  fileSize: z.number(),
  uploadedAt: z.date(),
  backups: z.array(
    z.object({
      name: z.string(),
      fileSize: z.number(),
      uploadedAt: z.date().optional(),
    })
  ),
});
export type WorkDB = z.infer<typeof WorkDB>;
declare module "express-session" {
  interface SessionData {
    csrfToken: string | undefined;
    csrfTokenWithHash: string | undefined;
  }
}
