import mongoose from "mongoose";
import { app } from "./app";
import { createSlackStrategy, preparePassport } from "./config/passport";
import * as logger from "./modules/logger";
import { env } from "./utils/env";

async function prepareDatabase() {
  await mongoose.connect(env.DATABASE_URL);
  const db = mongoose.connection;
  db.once("open", () => {
    logger.system.info("データベースに接続しました。");
  });
  db.on("stop", (error) => {
    logger.system.error("データベース関連のエラーが発生しました。", error);
  });
}
prepareDatabase()
  .then(createSlackStrategy)
  .then(preparePassport)
  .then(() => {
    const port = env.PORT;
    app.listen(port, "::0", () => {
      logger.system.info(`Listening on port ${port}`);
    });
  })
  .catch((error) => {
    logger.system.error("起動に失敗しました", error);
  });
