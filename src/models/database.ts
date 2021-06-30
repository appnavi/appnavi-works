import { Document, model, Schema, Types } from "mongoose";
export interface WorkDocument extends Document {
  creatorId: string;
  workId: string;
  owner: string;
  fileSize: number;
  uploadedAt: Date;
  backups: Types.Array<{ name: string; fileSize: number; uploadedAt: Date }>;
}
const workSchema = new Schema(
  {
    creatorId: String,
    workId: String,
    owner: String,
    fileSize: Number,
    uploadedAt: Date,
    backups: [
      {
        name: String,
        fileSize: Number,
        uploadedAt: Date,
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
  creatorIds: Types.Array<string>;
  guest?: {
    hashedPassword: string;
    createdBy: string;
  };
}
const userSchema = new Schema(
  {
    userId: String,
    defaultCreatorId: String,
    lastLogIn: Date,
    creatorIds: [String],
    guest: {
      type: {
        hashedPassword: String,
        createdBy: String,
      },
      required: false,
    },
  },
  {
    timestamps: true,
  }
);
export const UserModel = model<UserDocument>("User", userSchema);
