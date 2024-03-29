import {
  STATUS_CODE_BAD_REQUEST,
  STATUS_CODE_FORBIDDEN,
  STATUS_CODE_NOT_FOUND,
  STATUS_CODE_UNAUTHORIZED,
} from "./constants";

export class HttpError extends Error {
  constructor(
    public status: number,
    public responseMessage: string,
    public logParams: unknown = undefined,
  ) {
    super("エラー");
    this.name = new.target.name;
    // 下記の行はTypeScriptの出力ターゲットがES2015より古い場合(ES3, ES5)のみ必要
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(
    responseMessage = "ログインが必要です",
    logParams: unknown = undefined,
  ) {
    super(STATUS_CODE_UNAUTHORIZED, responseMessage, logParams);
  }
}
export class NotFoundError extends HttpError {
  constructor() {
    super(STATUS_CODE_NOT_FOUND, "ページが見つかりませんでした");
  }
}

export class CsrfError extends HttpError {
  constructor(responseMessage: string) {
    super(STATUS_CODE_FORBIDDEN, responseMessage);
  }
}

export class BadRequestError extends HttpError {
  constructor(
    responseMessage: string,
    public errors: unknown[] = [],
    logParams: unknown = undefined,
  ) {
    super(STATUS_CODE_BAD_REQUEST, responseMessage, logParams);
  }
}

export class UploadError extends BadRequestError {
  constructor(errors: unknown[] = [], logParams: unknown = undefined) {
    super("アップロードに失敗しました。", errors, logParams);
  }
}
