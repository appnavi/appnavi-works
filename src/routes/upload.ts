import fs from "fs";
import os from "os";
import path from "path";
import disk from "diskusage";
import express from "express";
import fsExtra from "fs-extra";
import { getContentSecurityPolicy } from "../helpers";
import * as logger from "../modules/logger";
import { ensureAuthenticated } from "../services/auth";
import {
  DIRECTORY_UPLOADS_DESTINATION,
  URL_PREFIX_GAME,
  getUnityDir,
  calculateTotalFileSize,
  unityUpload,
} from "../services/upload";

interface Locals {
  uploadStartedAt: Date;
}
//TODO：アップロード失敗エラーをクラスに変更
const fields = [
  {
    name: "webgl",
  },
  {
    name: "windows",
  },
];

const uploadRouter = express.Router();
uploadRouter.use(ensureAuthenticated);
uploadRouter.use(getContentSecurityPolicy());

uploadRouter
  .route("/unity")
  .get(function (req, res) {
    res.render("upload/unity");
  })
  .post(
    validateDestinationPath,
    validateDestination,
    ensureDiskSpaceAvailable,
    beforeUpload,
    unityUpload.fields(fields),
    ensureUploadSuccess,
    logUploadSuccess,
    (req, res) => {
      res.send({
        path: `/${path.join(URL_PREFIX_GAME, getUnityDir(req))}`,
      });
    }
  );

uploadRouter.use(function (
  err: NodeJS.Dict<unknown>,
  req: express.Request,
  res: express.Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: express.NextFunction //この引数を省略すると、views/error.ejsが描画されなくなる
) {
  if (err instanceof Error) {
    console.log(err);
    next(err);
    return;
  }
  const params = (err.params as unknown[]) ?? [];
  logger.system.error(`アップロード失敗：${err.message as string}`, ...params);
  res.status(500).send(err.message);
});

function validateDestinationPath(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const creatorId = req.headers["x-creator-id"];
  const gameId = req.headers["x-game-id"];
  if (
    typeof creatorId !== "string" ||
    typeof gameId !== "string" ||
    creatorId.length == 0 ||
    gameId.length == 0
  ) {
    next({
      message: "作者IDとゲームIDを両方を指定する必要があります。",
      params: [creatorId, gameId],
    });
    return;
  }
  if (!/^[0-9a-z-]+$/.test(creatorId) || !/^[0-9a-z-]+$/.test(gameId)) {
    next({
      message:
        "作者IDおよびゲームIDは数字・アルファベット小文字・ハイフンのみ使用できます。",
      params: [creatorId, gameId],
    });
    return;
  }
  next();
}
async function validateDestination(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const gameDir = path.join(DIRECTORY_UPLOADS_DESTINATION, getUnityDir(req));
  if (fs.existsSync(gameDir)) {
    const overwritesExisting = req.headers["x-overwrites-existing"] as string;
    if (overwritesExisting !== "true") {
      next({
        message:
          "ゲームが既に存在しています。上書きする場合はチェックボックスにチェックを入れてください",
        params: [gameDir],
      });
      return;
    }
    await fsExtra.remove(gameDir);
  }
  next();
}
function ensureDiskSpaceAvailable(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const path = os.platform() === "win32" ? "c:" : "/";
  disk.check(path, (err, info) => {
    //1024^3 B = 1GB以上のスペースがあればアップロードを許可
    if ((info?.available ?? 0) >= Math.pow(1024, 3)) {
      next();
      return;
    }
    next({
      message: "スペースが十分ではありません",
    });
  });
}
function beforeUpload(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  (res.locals as Locals).uploadStartedAt = new Date();
  next();
}
function ensureUploadSuccess(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const files =
    (req.files as {
      [fieldname: string]: Express.Multer.File[];
    }) ?? {};
  if (Object.keys(files).length == 0) {
    next({
      message: "アップロードするファイルがありません。",
    });
    return;
  }
  next();
}
function logUploadSuccess(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const uploadStartedAt = (res.locals as Locals).uploadStartedAt;
  const uploadEndedAt = new Date();
  const elapsedMillis = uploadEndedAt.getTime() - uploadStartedAt.getTime();
  const files = req.files as {
    [fieldname: string]: Express.Multer.File[];
  };
  const totalFileSize = calculateTotalFileSize(files, fields);
  logger.system.info(
    "アップロード成功",
    getUnityDir(req),
    `${elapsedMillis}ms`,
    `${totalFileSize}bytes`
  );
  next();
}
export { uploadRouter };
