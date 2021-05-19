export const URL_PREFIX_WORK = "/works";
export const URL_PREFIX_PRIVATE = "/private";

export const DIRECTORY_UPLOADS_DESTINATION = "uploads";

//srcディレクトリからのフォルダの相対パス
export const DIRECTORY_NAME_PRIVATE = "private";
export const DIRECTORY_NAME_PUBLIC = "public";
export const DIRECTORY_NAME_VIEWS = "views";
export const DIRECTORY_NAME_BACKUPS = "backups";

export const HEADER_CREATOR_ID = "x-creator-id";
export const HEADER_WORK_ID = "x-work-id";

export const STATUS_CODE_SUCCESS = 200;
export const STATUS_CODE_REDIRECT_PERMANENT = 301;
export const STATUS_CODE_REDIRECT_TEMPORARY = 302;
export const STATUS_CODE_BAD_REQUEST = 400;
export const STATUS_CODE_UNAUTHORIZED = 401;
export const STATUS_CODE_SERVER_ERROR = 500; //TODO：STATUS_CODE_BAD_REQUESTに置き換え

export const MESSAGE_UNITY_UPLOAD_CREATOR_ID_REQUIRED = "作者IDは必須です。";
export const MESSAGE_UNITY_UPLOAD_CREATOR_ID_INVALID =
  "作者IDには数字・アルファベット小文字・ハイフンのみ使用できます。";
export const MESSAGE_UNITY_UPLOAD_WORK_ID_REQUIRED = "作品IDは必須です。";
export const MESSAGE_UNITY_UPLOAD_WORK_ID_INVALID =
  "作品IDには数字・アルファベット小文字・ハイフンのみ使用できます。";
export const MESSAGE_UNITY_UPLOAD_DIFFERENT_USER =
  "別の人が既に投稿した作品があります。上書きすることはできません。";
export const MESSAGE_UNITY_UPLOAD_STORAGE_FULL =
  "スペースが十分ではありません。";
export const MESSAGE_UNITY_UPLOAD_NO_FILES =
  "アップロードするファイルがありません。";
export const MESSAGE_BACKUP_NAME_REQUIRED = "バックアップ名は必須です。";
export const MESSAGE_BACKUP_NAME_INVALID =
  "バックアップ名には数字のみである必要があります。";
