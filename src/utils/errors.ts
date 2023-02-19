import {
  STATUS_CODE_BAD_REQUEST,
  STATUS_CODE_FORBIDDEN,
  STATUS_CODE_NOT_FOUND,
  STATUS_CODE_UNAUTHORIZED,
} from "./constants";

export class HttpError extends Error {
  constructor(
    public status: number,
    logMessage: string,
    public logParams: unknown = undefined
  ) {
    super(logMessage);
    this.name = new.target.name;
    // 下記の行はTypeScriptの出力ターゲットがES2015より古い場合(ES3, ES5)のみ必要
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(
    logMessage = "ログインが必要です",
    logParams: unknown = undefined
  ) {
    super(STATUS_CODE_UNAUTHORIZED, logMessage, logParams);
    this.name = new.target.name;
    // 下記の行はTypeScriptの出力ターゲットがES2015より古い場合(ES3, ES5)のみ必要
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
export class NotFoundError extends HttpError {
  constructor() {
    super(STATUS_CODE_NOT_FOUND, "ページが見つかりませんでした");
    this.name = new.target.name;
    // 下記の行はTypeScriptの出力ターゲットがES2015より古い場合(ES3, ES5)のみ必要
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class CsrfError extends HttpError {
  constructor(logMessage: string) {
    super(STATUS_CODE_FORBIDDEN, logMessage);
    this.name = new.target.name;
    // 下記の行はTypeScriptの出力ターゲットがES2015より古い場合(ES3, ES5)のみ必要
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BadRequestError extends HttpError {
  constructor(
    logMessage: string,
    public errors: unknown[] = [],
    logParams: unknown = undefined
  ) {
    super(STATUS_CODE_BAD_REQUEST, logMessage, logParams);
    this.name = new.target.name;
    // 下記の行はTypeScriptの出力ターゲットがES2015より古い場合(ES3, ES5)のみ必要
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UploadError extends BadRequestError {
  constructor(errors: unknown[] = [], logParams: unknown = undefined) {
    super("アップロードに失敗しました。", errors, logParams);

    this.name = new.target.name;
    // 下記の行はTypeScriptの出力ターゲットがES2015より古い場合(ES3, ES5)のみ必要
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class RenameWorkError extends BadRequestError {
  constructor(errors: unknown[] = [], logParams: unknown = undefined) {
    super("作品のリネームに失敗しました。", errors, logParams);

    this.name = new.target.name;
    // 下記の行はTypeScriptの出力ターゲットがES2015より古い場合(ES3, ES5)のみ必要
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
export class DeleteWorkError extends BadRequestError {
  constructor(errors: unknown[] = [], logParams: unknown = undefined) {
    super("作品のリネームに失敗しました。", errors, logParams);

    this.name = new.target.name;
    // 下記の行はTypeScriptの出力ターゲットがES2015より古い場合(ES3, ES5)のみ必要
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
export class RestoreBackupError extends BadRequestError {
  constructor(errors: unknown[] = [], logParams: unknown = undefined) {
    super("バックアップの復元に失敗しました。", errors, logParams);

    this.name = new.target.name;
    // 下記の行はTypeScriptの出力ターゲットがES2015より古い場合(ES3, ES5)のみ必要
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
export class DeleteGuestUserError extends BadRequestError {
  constructor(errors: unknown[] = [], logParams: unknown = undefined) {
    super("ゲストユーザー削除に失敗しました。", errors, logParams);

    this.name = new.target.name;
    // 下記の行はTypeScriptの出力ターゲットがES2015より古い場合(ES3, ES5)のみ必要
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
