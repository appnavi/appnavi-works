export const URL_PREFIX_GAME = "/games";
export const URL_PREFIX_PRIVATE = "/private";

export const DIRECTORY_UPLOADS_DESTINATION = "uploads";

//srcディレクトリからのフォルダの相対パス
export const DIRECTORY_NAME_PRIVATE = "private";
export const DIRECTORY_NAME_PUBLIC = "public";
export const DIRECTORY_NAME_VIEWS = "views";
export const DIRECTORY_NAME_BACKUPS = "backups";

export const HEADER_CREATOR_ID = "x-creator-id";
export const HEADER_GAME_ID = "x-game-id";
export const HEADER_OVERWRITES_EXISTING = "x-overwrites-existing";

export const STATUS_CODE_SUCCESS = 200;
export const STATUS_CODE_REDIRECT_PERMANENT = 301;
export const STATUS_CODE_REDIRECT_TEMPORARY = 302;
export const STATUS_CODE_UNAUTHORIZED = 401;
export const STATUS_CODE_FAILURE = 500;

export const MESSAGE_UNITY_UPLOAD_CREATOR_ID_REQUIRED = "作者IDは必須です。";
export const MESSAGE_UNITY_UPLOAD_CREATOR_ID_INVALID =
  "作者IDには数字・アルファベット小文字・ハイフンのみ使用できます。";
export const MESSAGE_UNITY_UPLOAD_GAME_ID_REQUIRED = "ゲームIDは必須です。";
export const MESSAGE_UNITY_UPLOAD_GAME_ID_INVALID =
  "ゲームIDには数字・アルファベット小文字・ハイフンのみ使用できます。";
export const MESSAGE_UNITY_UPLOAD_ALREADY_EXISTS =
  "ゲームが既に存在しています。上書きする場合はチェックボックスにチェックを入れてください。";
export const MESSAGE_UNITY_UPLOAD_DIFFERENT_USER =
  "別の人が既に投稿したゲームがあります。上書きすることはできません。";
export const MESSAGE_UNITY_UPLOAD_STORAGE_FULL = "スペースが十分ではありません。";
export const MESSAGE_UNITY_UPLOAD_NO_FILES = "アップロードするファイルがありません。";

