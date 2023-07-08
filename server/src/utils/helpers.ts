import crypto from "crypto";
import express from "express";

export const randomStringCharacters =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
export function generateRandomString(
  length: number,
  characters: string | undefined = undefined,
) {
  // 引用：https://qiita.com/fukasawah/items/db7f0405564bdc37820e
  const S = characters ?? randomStringCharacters;
  return Array.from(crypto.randomFillSync(new Uint8Array(length)))
    .map((n) => S[n % S.length])
    .join("");
}

// http://expressjs.com/en/advanced/best-practice-performance.html#use-promises
export function wrap(
  asyncHandler: (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => Promise<void>,
) {
  return (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    asyncHandler(req, res, next).catch(next);
  };
}
