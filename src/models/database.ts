import { Schema, model } from "mongoose";
const gameSchema = new Schema(
  {
    creatorId: String,
    gameId: String,
    createdBy: String,
  },
  {
    timestamps: true,
  }
);
const GameModel = model("Game", gameSchema);
const userSchema = new Schema(
  {
    userId: String,
    defaultCreatorId: String,
  },
  {
    timestamps: true,
  }
);
const UserModel = model("User", userSchema);
export { GameModel, UserModel };
