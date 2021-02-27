import mongoose from "mongoose";
import { app } from "./app";
import * as logger from "./modules/logger";
import { getEnv, getEnvNumber } from "./utils/helpers";

mongoose
  .connect(getEnv("DATABASE_URL"), {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    const db = mongoose.connection;
    db.once("open", () => {
      logger.system.info("データベースに接続しました。");
    });
    db.on("stop", (error) => {
      logger.system.error("データベース関連のエラーが発生しました。", error);
    });
    const port = getEnvNumber("PORT");
    app.listen(port, () => {
      logger.system.info(`Listening on port ${port}`);
    });
  })
  .catch((error) => {
    logger.system.error("データベース関連のエラーが発生しました。", error);
  });
