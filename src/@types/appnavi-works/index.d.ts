type SlackUser = {
  ok: boolean;
  user: {
    name: string;
    id: string;
    email: string;
    image_24: string;
    image_32: string;
    image_48: string;
    image_72: string;
    image_192: string;
    image_512: string;
  };
  team: {
    id: string;
    name: string;
  };
  id: string;
  displayName: string;
};
type GuestUser = {
  id: string;
  name: string;
  isGuest: true;
};
