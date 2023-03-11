//srcディレクトリからのフォルダの相対パス
export const DIRECTORY_NAME_PUBLIC = "public";
export const DIRECTORY_NAME_VIEWS = "views";

export const STATUS_CODE_SUCCESS = 200;
export const STATUS_CODE_REDIRECT_PERMANENT = 301;
export const STATUS_CODE_REDIRECT_TEMPORARY = 302;
export const STATUS_CODE_BAD_REQUEST = 400;
export const STATUS_CODE_UNAUTHORIZED = 401;
export const STATUS_CODE_FORBIDDEN = 403;
export const STATUS_CODE_NOT_FOUND = 404;
export const STATUS_CODE_SERVER_ERROR = 500;

export const ERROR_MESSAGE_CREATOR_ID_REQUIRED = "作者IDは必須です。";
export const ERROR_MESSAGE_CREATOR_ID_INVALID =
  "作者IDには数字・アルファベット小文字・ハイフンのみ使用できます。";
export const ERROR_MESSAGE_WORK_ID_REQUIRED = "作品IDは必須です。";
export const ERROR_MESSAGE_WORK_ID_INVALID =
  "作品IDには数字・アルファベット小文字・ハイフンのみ使用できます。";
export const ERROR_MESSAGE_CREATOR_ID_USED_BY_OTHER_USER =
  "指定した作者IDは別のユーザーによって既に使われています。";
export const ERROR_MESSAGE_STORAGE_FULL = "スペースが十分ではありません。";
export const ERROR_MESSAGE_NO_FILES = "アップロードするファイルがありません。";
export const ERROR_MESSAGE_BACKUP_NAME_REQUIRED = "バックアップ名は必須です。";
export const ERROR_MESSAGE_BACKUP_NAME_INVALID =
  "バックアップ名には数字のみである必要があります。";
export const ERROR_MESSAGE_WORK_NOT_FOUND = "作品が存在しません。";
export const ERROR_MESSAGE_WORK_DIFFERENT_OWNER =
  "この作品の所有者ではありません。";
export const ERROR_MESSAGE_MULTIPLE_WORKS_FOUND =
  "同じ作品が複数登録されています。";
export const ERROR_MESSAGE_RENAME_TO_SAME =
  "リネーム前とリネーム後が同じです。";
export const ERROR_MESSAGE_RENAME_TO_EXISTING =
  "既に存在する作品を上書きすることはできません。";
export const ERROR_MESSAGE_BACKUP_NOT_FOUND =
  "バックアップが見つかりませんでした。";
export const ERROR_MESSAGE_GUEST_ID_REQUIRED =
  "ゲストユーザーのユーザーIDは必須です。";
export const ERROR_MESSAGE_GUEST_ID_INVALID =
  "ゲストユーザーのユーザーIDが不適切な文字列です。";
export const ERROR_MESSAGE_GUEST_NOT_FOUND =
  "ゲストユーザーが見つかりませんでした。";
export const ERROR_MESSAGE_MULTIPLE_GUESTS_FOUND =
  "同じゲストユーザーが複数登録されています。";
export const ERROR_MESSAGE_NOT_GUEST_USER = "ゲストユーザーではありません。";
export const ERROR_MESSAGE_GUEST_DIFFERENT_CREATOR =
  "別のユーザーによって作成されたゲストユーザーを削除することはできません。";
export const ERROR_MESSAGE_GUEST_WORKS_NOT_EMPTY =
  "このゲストユーザーが投稿した作品が存在します。";
export const ERROR_MESSAGE_GUEST_LOGIN_FAIL =
  "ユーザーIDまたはパスワードが違います。";
export const ERROR_MESSAGE_GUEST_LOGIN_EXCEED_RATE_LIMIT =
  "ログイン失敗回数が多すぎます。一時間後に再度お試しください。";

export const UPLOAD_UNITY_FIELD_WEBGL = "webgl";
export const UPLOAD_UNITY_FIELD_WINDOWS = "windows";
export const UPLOAD_UNITY_FIELDS = [
  {
    name: UPLOAD_UNITY_FIELD_WEBGL,
  },
  {
    name: UPLOAD_UNITY_FIELD_WINDOWS,
    maxCount: 1,
  },
];
