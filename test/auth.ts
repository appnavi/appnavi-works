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
    },
    team: {
      id: "test_team_id",
    },
    provider: "test_provider",
    id: userId,
    displayName: "test_display_name",
  });
}
function logout(app: Express) {
  passportStub.logout();
  passportStub.uninstall(app);
}

export { myId, theirId, login, logout };
