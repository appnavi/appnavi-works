declare namespace Express {
  interface User {
    id: string;
    name: string;
    avatar_url?: string;
    type: "Slack" | "Guest";
  }
}

type SlackUser = {
  ok: boolean;
  "https://slack.com/user_id": string;
  "https://slack.com/team_id": string;
  name: string;
  "https://slack.com/user_image_24": string;
};
