import { Document, model, Schema, Types } from "mongoose";
export interface WorkDocument extends Document {
  creatorId: string;
  workId: string;
  owner: string;
  totalFileSize: number;
  backups: Types.Array<{ name: string; fileSize: number }>;
}
const workSchema = new Schema(
  {
    creatorId: String,
    workId: String,
    owner: String,
    totalFileSize: Number,
    backups: [
      {
        name: String,
        fileSize: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);
export const WorkModel = model<WorkDocument>("Work", workSchema);

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
