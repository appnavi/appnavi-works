import { Express } from "express";

const passportStub = require("passport-stub");

const myId = "userABC";
const theirId = "userDEF";

function login(app: Express, userId: string, type: string = "Slack"): void {
  passportStub.install(app);
  passportStub.login({
    id: userId,
    name: "test_name",
    type,
  });
}
function logout(app: Express) {
  passportStub.logout();
  passportStub.uninstall(app);
}

export { myId, theirId, login, logout };
