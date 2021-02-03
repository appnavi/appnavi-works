import { Schema, model } from "mongoose";
const gameInfoSchema = new Schema({
  authorId: String,
  gameId: String,
  createdBy: String,
}, {
  timestamps: true
});
const GameInfo = model("Game", gameInfoSchema);
const userSchema = new Schema({
  id: String,
  defaultAuthorId: String,
}, {
  timestamps: true
});
const User = model("User", userSchema);
export { GameInfo, User };
