const SlackStrategy = require("async-passport-slack").Strategy;
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
//参考：https://github.com/mblackshaw/passport-slack/blob/master/lib/passport-slack/strategy.js
const oauth2 = strategy._oauth2;
const getToken = oauth2.getOAuthAccessToken;
oauth2.getOAuthAccessToken = function (code, params, callback) {
  getToken.call(
    oauth2,
    code,
    params,
    function (err, accessToken, refreshToken, params) {
      if (err) {
        return callback(err);
      }
      var accessToken = params["authed_user"]["access_token"];
      var refreshToken = "";
      callback(null, accessToken, refreshToken, params);
    }
  );
};
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
