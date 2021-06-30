import { Db, ObjectID } from "mongodb";
import { WorkDocument, UserDocument } from "../../src/models/database";

type DocumentId = {
  _id: ObjectID;
};

module.exports = {
  async up(db: Db) {
    const users = await db
      .collection<UserDocument & DocumentId>("users")
      .find({})
      .toArray();
    const works = await db
      .collection<WorkDocument & DocumentId>("works")
      .find({})
      .toArray();
    users.forEach(async (user) => {
      const creatorIds = Array.from(
        new Set(
          works
            .filter((it) => it.owner === user.userId)
            .map((it) => it.creatorId)
        )
      );
      await db.collection("users").updateOne(
        {
          _id: user._id,
        },
        {
          $set: {
            creatorIds,
          },
        }
      );
    });
  },
  async down(db: Db) {
    await db.collection("users").updateMany({}, { $unset: { creatorIds: "" } });
  },
};
