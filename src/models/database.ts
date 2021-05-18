import { Document, model, Schema, Types } from "mongoose";
export interface WorkDocument extends Document {
  creatorId: string;
  workId: string;
  createdBy: string;
  totalFileSize: number;
  backupFileSizes: Types.Map<number>;
}
const workSchema = new Schema(
  {
    creatorId: String,
    workId: String,
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
