import { Express } from "express";

const passportStub = require("passport-stub");

const myId = "userABC";
const theirId = "userDEF";

function login(app: Express, userId: string): void {
  passportStub.install(app);
  passportStub.login({
    ok: true,
    user: {
      name: "test_user_name",
      id: userId,
      email: "test_user_email",
      image_24: "test_user_image_24",
      image_32: "test_user_image_32",
      image_48: "test_user_image_48",
      image_72: "test_user_image_72",
      image_192: "test_user_image_192",
      image_512: "test_user_image_512",
    },
    team: {
      id: "test_team_id",
      name: "test_team_name",
      domain: "test_team_domain",
      image_34: "test_team_image_34",
      image_44: "test_team_image_44",
      image_68: "test_team_image_68",
      image_88: "test_team_image_88",
      image_102: "test_team_image_102",
      image_132: "test_team_image_132",
      image_230: "test_team_image_230",
      image_default: "test_team_image_default",
    },
    provider: "test_provider",
    id: "test_id",
    displayName: "test_display_name",
  });
}
function logout(app: Express) {
  passportStub.logout();
  passportStub.uninstall(app);
}

export { myId, theirId, login, logout };
