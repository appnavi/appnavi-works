import fs from "fs";
import os from "os";
import path from "path";
import disk from "diskusage";
import express from "express";
import fsExtra from "fs-extra";
import * as yup from "yup";
import { getContentSecurityPolicy } from "../helpers";
import * as logger from "../modules/logger";
import { ensureAuthenticated } from "../services/auth";
import {
  DIRECTORY_UPLOADS_DESTINATION,
  URL_PREFIX_GAME,
  getUnityDir,
  calculateTotalFileSize,
  unityUpload,
  fields,
} from "../services/upload";

interface Locals {
  uploadStartedAt: Date;
}
class UploadError extends Error {
  constructor(message: string, public params: unknown[]) {
    super(message);
    this.name = new.target.name;
    // 下記の行はTypeScriptの出力ターゲットがES2015より古い場合(ES3, ES5)のみ必要
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
const idRegex = /^[0-9a-z-]+$/;
const uploadSchema = yup.object({
  creatorId: yup
    .string()
    .matches(
      idRegex,
      "作者IDには数字・アルファベット小文字・ハイフンのみ使用できます。"
    )
    .required("作者IDは必須です。"),
  gameId: yup
    .string()
    .matches(
      idRegex,
      "ゲームIDには数字・アルファベット小文字・ハイフンのみ使用できます。"
    )
    .required("ゲームIDは必須です。"),
  overwritesExisting: yup.string().matches(/^(true|false)$/),
});

const uploadRouter = express.Router();
uploadRouter.use(ensureAuthenticated);
uploadRouter.use(getContentSecurityPolicy());

uploadRouter
  .route("/unity")
  .get(function (req, res) {
    res.render("upload/unity");
  })
  .post(
    validateParams,
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
  if (!(err instanceof UploadError)) {
    next(err);
    return;
  }
  const params = err.params;
  logger.system.error(`アップロード失敗：${err.message}`, ...params);
  res.status(500).send(err.message);
});

function validateParams(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const creatorId = req.headers["x-creator-id"];
  const gameId = req.headers["x-game-id"];
  const overwritesExisting = req.headers["x-overwrites-existing"];

  uploadSchema
    .validate({
      creatorId: creatorId,
      gameId: gameId,
      overwritesExisting,
    })
    .then(() => {
      next();
    })
    .catch((err: { name: string; errors: string[] }) => {
      next(
        new UploadError(err.errors[0], [creatorId, gameId, overwritesExisting])
      );
    });
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
      next(
        new UploadError(
          "ゲームが既に存在しています。上書きする場合はチェックボックスにチェックを入れてください",
          [gameDir]
        )
      );
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
