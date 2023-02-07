import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";
import * as logger from "../../modules/logger";
import { env } from "../../utils/env";
import { CsrfError } from "../../utils/errors";
import { wrap } from "../../utils/helpers";

// ---------------------------------------------------------------------
// Ported from https://github.com/nextauthjs/next-auth/blob/1db27fcd07ca6d512682afe70233d2cb2d80f360/packages/core/src/lib/csrf-token.ts
/*
ISC License

Copyright (c) 2022-2023, Balázs Orbán

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
*/
/** Web compatible method to create a hash, using SHA256 */
export async function createHash(message: string) {
  const data = new TextEncoder().encode(message);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toString();
}

/** Web compatible method to create a random string of a given length */
export function randomString(size: number) {
  const i2hex = (i: number) => ("0" + i.toString(16)).slice(-2);
  const r = (a: string, i: number): string => a + i2hex(i);
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  return Array.from(bytes).reduce(r, "");
}
// ---------------------------------------------------------------------

function getCsrfTokenFromRequest(req: Request): string | undefined {
  return req.body?.["_csrf"] ?? req.headers["csrf-token"];
}
export function getCsrfTokenFromSession(req: Request): string | undefined {
  return req.session.csrfTokenWithHash;
}

export function csrf(req: Request, res: Response, next: NextFunction) {
  return wrap(async (req, _res, next) => {
    logger.system.info("csrf", req.originalUrl);
    if (req.method === "GET") {
      if (
        req.session.csrfToken === undefined ||
        req.session.csrfTokenWithHash === undefined
      ) {
        const csrfToken = randomString(32);
        const csrfTokenHash = await createHash(
          `${csrfToken}${env.CSRF_TOKEN_SECRET}`
        );
        req.session.csrfToken = csrfToken;
        req.session.csrfTokenWithHash = `${csrfToken}|${csrfTokenHash}`;
      }
    } else if (req.method === "POST") {
      const csrfTokenFromSession = getCsrfTokenFromSession(req);
      if (csrfTokenFromSession === undefined) {
        next(
          new CsrfError("セッションからcsrfトークンを取得できませんでした。")
        );
        return;
      }
      const [csrfToken, csrfTokenHash] = csrfTokenFromSession.split("|");
      const expectedCsrfTokenHash = await createHash(
        `${csrfToken}${env.CSRF_TOKEN_SECRET}`
      );
      if (csrfTokenHash !== expectedCsrfTokenHash) {
        next(new CsrfError("csrfトークンが改ざんされた可能性があります。"));
        return;
      }
      const incomingCsrfToken = getCsrfTokenFromRequest(req);
      if (incomingCsrfToken === undefined) {
        next(
          new CsrfError("リクエストからcsrfトークンを取得できませんでした。")
        );
        return;
      }
      if (csrfToken !== incomingCsrfToken) {
        next(new CsrfError("csrfトークンが異なります。"));
        console.log(csrfToken, incomingCsrfToken);
        return;
      }
    } else {
      next(
        new CsrfError(`csrfはメソッド ${req.method} をサポートしていません。`)
      );
      return;
    }
    next();
  })(req, res, next);
}
