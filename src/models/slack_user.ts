export interface SlackUser {
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
    domain: string;
    image_34: string;
    image_44: string;
    image_68: string;
    image_88: string;
    image_102: string;
    image_132: string;
    image_230: string;
    image_default: boolean;
  };
  provider: string;
  id: string;
  displayName: string;
}
