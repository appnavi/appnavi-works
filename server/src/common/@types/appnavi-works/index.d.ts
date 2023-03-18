// TODO：このファイルを削除
// ユーザー情報はcommon/types.tsの User を使って User.parse(req.user) などのように取得するように
declare namespace Express {
  interface User {
    id: string;
    name: string;
    avatar_url?: string;
    type: "Slack" | "Guest";
  }
}
