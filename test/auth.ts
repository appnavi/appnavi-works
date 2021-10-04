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
function logout() {
  passportStub.logout();
  passportStub.uninstall();
}

export { myId, theirId, login, logout };
