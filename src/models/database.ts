import { Document, model, Schema, Types } from "mongoose";
export interface GameDocument extends Document {
  creatorId: string;
  gameId: string;
  createdBy: string;
  totalFileSize: number;
  backupFileSizes: Types.Map<number>;
}
const gameSchema = new Schema(
  {
    creatorId: String,
    gameId: String,
    createdBy: String,
    totalFileSize: Number,
    backupFileSizes: {
      type: Map,
      of: Number,
    },
  },
  {
    timestamps: true,
  }
);
export const GameModel = model<GameDocument>("Game", gameSchema);

export interface UserDocument extends Document {
  userId: string;
  defaultCreatorId: string;
  lastLogIn: Date;
}
const userSchema = new Schema(
  {
    userId: String,
    defaultCreatorId: String,
    lastLogIn: Date,
  },
  {
    timestamps: true,
  }
);
export const UserModel = model<UserDocument>("User", userSchema);
