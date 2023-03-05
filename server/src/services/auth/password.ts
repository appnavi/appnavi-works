// 参考
// - http://var.blog.jp/archives/79901479.html
// - https://dev.to/farnabaz/hash-your-passwords-with-scrypt-using-nodejs-crypto-module-316k

import crypto from "crypto";

const defaultSaltByteSize = 32;
const defaultKeyLength = 64;

const separator = ",";

const saltEncoding = "base64";
const hashEncoding = "base64";

function scryptAsync(
  password: crypto.BinaryLike,
  salt: crypto.BinaryLike,
  keylen: number
) {
  return new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, keylen, (err, result) => {
      if (err !== null) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

export async function hashPassword(
  plainTextPassword: string,
  saltByteSize: number = defaultSaltByteSize,
  keyLength: number = defaultKeyLength
) {
  const saltBuffer = crypto.randomBytes(saltByteSize);
  const hash = await scryptAsync(plainTextPassword, saltBuffer, keyLength);
  return [
    saltBuffer.toString(saltEncoding),
    keyLength.toString(),
    hash.toString(hashEncoding),
  ].join(separator);
}

export async function verifyPassword(
  passwordToVerify: string,
  correctHashedPassword: string
) {
  const splitted = correctHashedPassword.split(",");
  if (splitted.length != 3) {
    return false;
  }
  const [saltStr, keyLengthStr, correctHash] = splitted;
  const keyLength = parseInt(keyLengthStr);
  if (keyLength.toString() !== keyLengthStr) {
    return false;
  }
  const saltBuffer = Buffer.from(saltStr, saltEncoding);
  const hashedPasswordToVerify = await scryptAsync(
    passwordToVerify,
    saltBuffer,
    keyLength
  );
  const correctHashBuffer = Buffer.from(correctHash, hashEncoding);
  return crypto.timingSafeEqual(hashedPasswordToVerify, correctHashBuffer);
}
