const SlackStrategy = require("passport-slack").Strategy;
const strategy = new SlackStrategy(
  {
    clientID: process.env["SLACK_CLIENT_ID"],
    clientSecret: process.env["SLACK_CLIENT_SECRET"],
    callbackURL: process.env["SLACK_REDIRECT_URI"],
    skipUserProfile: false,
    user_scope: [
      "identity.basic",
      "identity.email",
      "identity.avatar",
      "identity.team",
    ], // default
  },
  function (accessToken, refreshToken, profile, done) {
    return done(null, profile);
  }
);
function preparePassport(passport) {
  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  passport.deserializeUser(function (user, done) {
    done(null, user);
  });

  passport.use(strategy);
}

export { preparePassport };
