import { Document, model, Schema } from "mongoose";
export interface GameDocument extends Document {
  creatorId: string;
  gameId: string;
  createdBy: string;
  paths: string[];
  totalFileSize: number;
}
const gameSchema = new Schema(
  {
    creatorId: String,
    gameId: String,
    createdBy: String,
    paths: [String],
    totalFileSize: Number,
  },
  {
    timestamps: true,
  }
);
export const GameModel = model<GameDocument>("Game", gameSchema);

export interface UserDocument extends Document {
  userId: string;
  defaultCreatorId: string;
}
const userSchema = new Schema(
  {
    userId: String,
    defaultCreatorId: String,
  },
  {
    timestamps: true,
  }
);
export const UserModel = model<UserDocument>("User", userSchema);
