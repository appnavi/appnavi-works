import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { UserModel, WorkModel } from "../../../../models/database";
import { t, slackUserOnlyProcedure } from "../../../../utils/trpc";

const Users = z.object({
  userId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastLogIn: z.date(),
  defaultCreatorId: z.string().optional(),
  creatorIds: z.string().array(),
  guest: z.object({
    hashedPassword: z.string(),
    createdBy: z.string()
  }).optional()
}).transform(user => ({
  ...user,
  guest: user.guest !== undefined
})).array();
const Works = z.object({
  creatorId: z.string(),
  workId: z.string(),
  owner: z.string(),
  fileSize: z.number(),
  uploadedAt: z.date().optional(),
  backups: z.array(z.object({
    name: z.string(),
    fileSize: z.number(),
    uploadedAt: z.date().optional()
  }))
}).array();

export const dbRouter = t.router({
  fetchAllWorksRaw: slackUserOnlyProcedure.query(() => {
    return WorkModel.find();
  }),
  fetchAllWorks: slackUserOnlyProcedure.query(async () => {
    const works = await WorkModel.find();
    const parsed = Works.safeParse(works);
    if (!parsed.success) {
      console.log(fromZodError(parsed.error))
      return []
    }
    return parsed.data
  }),
  fetchAllUsers: slackUserOnlyProcedure.query(async () => {
    const users = await UserModel.find();
    // console.log(users[0].lastLogIn.name)
    const parsed = Users.safeParse(users);
    if (!parsed.success) {
      console.log(fromZodError(parsed.error))
      return []
    }
    return parsed.data
  }),
  fetchAllUsersRaw: slackUserOnlyProcedure.query(() => {
    return UserModel.find();
  }),
});



