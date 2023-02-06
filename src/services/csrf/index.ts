import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";
import * as logger from "../../modules/logger";
import { CsrfError } from "../../utils/errors";
import { wrap } from "../../utils/helpers";

function getCsrfTokenFromRequest(req: Request): string | undefined {
  return req.body?.["_csrf"] ?? req.headers["csrf-token"];
}
export function getCsrfTokenFromSession(req: Request): string | undefined {
  return req.session.csrfTokens;
}
export async function generateCsrfToken(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    crypto.randomBytes(48, (err, buffer) => {
      if (err !== null) {
        reject(err);
      } else {
        resolve(buffer.toString("base64"));
      }
    })
  })
}
export function csrf(
  req: Request,
  res: Response,
  next: NextFunction
) {
  return wrap(async (req, _res, next) => {
    logger.system.info("csrf", req.originalUrl);
    if (req.method === "GET") {
      if (req.session.csrfTokens === undefined) {
        req.session.csrfTokens = await generateCsrfToken();
      }
    } else if (req.method === "POST") {
      const correctCsrfToken = getCsrfTokenFromSession(req);
      if (correctCsrfToken === undefined) {
        next(new CsrfError("セッションからcsrfトークンを取得できませんでした。"))
        return;
      }
      const incomingCsrfToken = getCsrfTokenFromRequest(req);
      if (incomingCsrfToken === undefined) {
        next(new CsrfError("リクエストからcsrfトークンを取得できませんでした。"))
        return;
      }
      if (correctCsrfToken !== incomingCsrfToken) {
        next(new CsrfError("csrfトークンが異なります。"))
        return;
      }
    } else {
      next(new CsrfError(`csrfはメソッド ${req.method} をサポートしていません。`));
      return;
    }
    next();
  })(req, res, next);
}