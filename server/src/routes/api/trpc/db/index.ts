import { fromZodError } from "zod-validation-error";
import { UserDB, WorkDB } from "../../../../common/types";
import { UserModel, WorkModel } from "../../../../models/database";
import { t, slackUserOnlyProcedure } from "../../../../utils/trpc";

const Users = UserDB.array();
const Works = WorkDB.array();

export const dbRouter = t.router({
  fetchAllWorks: slackUserOnlyProcedure.query(async () => {
    const works = await WorkModel.find();
    const parsed = Works.safeParse(works);
    if (!parsed.success) {
      console.log(fromZodError(parsed.error));
      return [];
    }
    return parsed.data;
  }),
  fetchAllUsers: slackUserOnlyProcedure.query(async () => {
    const users = await UserModel.find();
    const parsed = Users.safeParse(users);
    if (!parsed.success) {
      console.log(fromZodError(parsed.error));
      return [];
    }
    return parsed.data;
  }),
});
