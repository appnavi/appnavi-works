import { STATUS_CODE_BAD_REQUEST } from "./constants";

export class CsrfError extends Error {
  status: number;
  constructor(logMessage: string) {
    super(logMessage);
    this.status = 403;
    this.name = new.target.name;
    // 下記の行はTypeScriptの出力ターゲットがES2015より古い場合(ES3, ES5)のみ必要
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BadRequestError extends Error {
  status: number;
  constructor(
    logMessage: string,
    public errors: unknown[] = [],
    public logParams: unknown = undefined
  ) {
    super(logMessage);
    this.status = STATUS_CODE_BAD_REQUEST;

    this.name = new.target.name;
    // 下記の行はTypeScriptの出力ターゲットがES2015より古い場合(ES3, ES5)のみ必要
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UploadError extends BadRequestError {
  constructor(
    public errors: unknown[] = [],
    public logParams: unknown = undefined
  ) {
    super("アップロードに失敗しました。", errors, logParams);

    this.name = new.target.name;
    // 下記の行はTypeScriptの出力ターゲットがES2015より古い場合(ES3, ES5)のみ必要
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class RenameWorkError extends BadRequestError {
  constructor(
    public errors: unknown[] = [],
    public logParams: unknown = undefined
  ) {
    super("作品のリネームに失敗しました。", errors, logParams);

    this.name = new.target.name;
    // 下記の行はTypeScriptの出力ターゲットがES2015より古い場合(ES3, ES5)のみ必要
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
export class DeleteWorkError extends BadRequestError {
  constructor(
    public errors: unknown[] = [],
    public logParams: unknown = undefined
  ) {
    super("作品のリネームに失敗しました。", errors, logParams);

    this.name = new.target.name;
    // 下記の行はTypeScriptの出力ターゲットがES2015より古い場合(ES3, ES5)のみ必要
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
export class RestoreBackupError extends BadRequestError {
  constructor(
    public errors: unknown[] = [],
    public logParams: unknown = undefined
  ) {
    super("バックアップの復元に失敗しました。", errors, logParams);

    this.name = new.target.name;
    // 下記の行はTypeScriptの出力ターゲットがES2015より古い場合(ES3, ES5)のみ必要
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
export class DeleteGuestUserError extends BadRequestError {
  constructor(
    public errors: unknown[] = [],
    public logParams: unknown = undefined
  ) {
    super("ゲストユーザー削除に失敗しました。", errors, logParams);

    this.name = new.target.name;
    // 下記の行はTypeScriptの出力ターゲットがES2015より古い場合(ES3, ES5)のみ必要
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
