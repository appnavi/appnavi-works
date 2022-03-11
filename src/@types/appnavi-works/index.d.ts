declare namespace Express {
  interface User {
    id: string;
    name: string;
    avatar_url?: string;
    type: "Slack" | "Guest";
  }
}
