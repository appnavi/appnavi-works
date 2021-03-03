import * as mongoose from "mongoose";
export interface GameDocument extends mongoose.Document {
  uploadStartedAt: Date;
  uploadEndedAt: Date;
  elapsedMillis: number;
  creatorId: string;
  gameId: string;
  createdBy: string;
  paths: string[];
  totalFileSize: number;
}
const gameSchema = new mongoose.Schema(
  {
    uploadStartedAt: Date,
    uploadEndedAt: Date,
    elapsedMillis: Number,
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
export const GameModel = mongoose.model<GameDocument>("Game", gameSchema);

export interface UserDocument extends mongoose.Document{
  userId: string,
  defaultCreatorId: string,
}
const userSchema = new mongoose.Schema(
  {
    userId: String,
    defaultCreatorId: String,
  },
  {
    timestamps: true,
  }
);
export const UserModel = mongoose.model<UserDocument>("User", userSchema);
