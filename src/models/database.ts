import * as mongoose from "mongoose";
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
