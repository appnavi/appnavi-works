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
const GameInfo = model("Game", gameInfoSchema);
const userSchema = new Schema(
  {
    userId: String,
    defaultCreatorId: String,
  },
  {
    timestamps: true,
  }
);
const User = model("User", userSchema);
export { GameInfo, User };
