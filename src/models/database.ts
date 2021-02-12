import * as mongoose  from "mongoose";
const gameSchema = new mongoose.Schema(
  {
    creatorId: String,
    gameId: String,
    createdBy: String,
  },
  {
    timestamps: true,
  }
);
const GameModel = mongoose.model("Game", gameSchema);
const userSchema = new mongoose.Schema(
  {
    userId: String,
    defaultCreatorId: String,
  },
  {
    timestamps: true,
  }
);
const UserModel = mongoose.model("User", userSchema);
export { GameModel, UserModel };
