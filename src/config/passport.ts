import { PassportStatic } from "passport";
import OAuth2Strategy from "passport-oauth2";
import { Strategy as SlackStrategy } from "passport-slack";
const strategy = new SlackStrategy(
  {
    clientID: process.env["SLACK_CLIENT_ID"] ?? "",
    clientSecret: process.env["SLACK_CLIENT_SECRET"] ?? "",
    callbackURL: process.env["SLACK_REDIRECT_URI"] ?? "",
    skipUserProfile: false,
    user_scope: [
      "identity.basic",
      "identity.email",
      "identity.avatar",
      "identity.team",
    ], // default
  },
  function (
    _accessToken: string,
    _refreshToken: string,
    profile: Express.User,
    done: OAuth2Strategy.VerifyCallback
  ) {
    return done(null, profile);
  }
);

function preparePassport(passport: PassportStatic): void {
  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  passport.deserializeUser(function (user, done) {
    done(null, user as Express.User);
  });

  passport.use(strategy);
}

export { preparePassport };
