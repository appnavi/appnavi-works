import { Schema, model } from "mongoose";
const gameInfoSchema = new Schema(
  {
    creatorId: String,
    gameId: String,
    createdBy: String,
  },
  {
    timestamps: true,
  }
);
const GameModel = model("Game", gameInfoSchema);
const userSchema = new Schema(
  {
    userId: String,
    defaultCreatorId: String,
  },
  {
    timestamps: true,
  }
);
const UserModel = model("UserModel", userSchema);
export { GameModel, UserModel };
