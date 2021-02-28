const URL_PREFIX_GAME = "/games";
const URL_PREFIX_PRIVATE = "/private";

const DIRECTORY_UPLOADS_DESTINATION = "uploads";

//srcディレクトリからのフォルダの相対パス
const DIRECTORY_NAME_PRIVATE = "private";
const DIRECTORY_NAME_PUBLIC = "public";
const DIRECTORY_NAME_VIEWS = "views";
const DIRECTORY_NAME_BACKUPS = "backups";

const STATUS_CODE_SUCCESS = 200;
const STATUS_CODE_REDIRECT_PERMANENT = 301;
const STATUS_CODE_REDIRECT_TEMPORARY = 302;
const STATUS_CODE_UNAUTHORIZED = 401;
const STATUS_CODE_FAILURE = 500;

const MESSAGE_UNITY_UPLOAD_CREATOR_ID_REQUIRED = "作者IDは必須です。";
const MESSAGE_UNITY_UPLOAD_CREATOR_ID_INVALID =
  "作者IDには数字・アルファベット小文字・ハイフンのみ使用できます。";
const MESSAGE_UNITY_UPLOAD_GAME_ID_REQUIRED = "ゲームIDは必須です。";
const MESSAGE_UNITY_UPLOAD_GAME_ID_INVALID =
  "ゲームIDには数字・アルファベット小文字・ハイフンのみ使用できます。";
const MESSAGE_UNITY_UPLOAD_ALREADY_EXISTS =
  "ゲームが既に存在しています。上書きする場合はチェックボックスにチェックを入れてください。";
const MESSAGE_UNITY_UPLOAD_DIFFERENT_USER = 
"別の人が既に投稿したゲームがあります。上書きすることはできません。";
export {
  URL_PREFIX_GAME,
  URL_PREFIX_PRIVATE,
  DIRECTORY_UPLOADS_DESTINATION,
  DIRECTORY_NAME_PRIVATE,
  DIRECTORY_NAME_PUBLIC,
  DIRECTORY_NAME_VIEWS,
  DIRECTORY_NAME_BACKUPS,
  STATUS_CODE_SUCCESS,
  STATUS_CODE_REDIRECT_PERMANENT,
  STATUS_CODE_REDIRECT_TEMPORARY,
  STATUS_CODE_UNAUTHORIZED,
  STATUS_CODE_FAILURE,
  MESSAGE_UNITY_UPLOAD_CREATOR_ID_REQUIRED,
  MESSAGE_UNITY_UPLOAD_CREATOR_ID_INVALID,
  MESSAGE_UNITY_UPLOAD_GAME_ID_REQUIRED,
  MESSAGE_UNITY_UPLOAD_GAME_ID_INVALID,
  MESSAGE_UNITY_UPLOAD_ALREADY_EXISTS,
  MESSAGE_UNITY_UPLOAD_DIFFERENT_USER
};
