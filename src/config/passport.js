const passport = require('passport');
const SlackStrategy = require('async-passport-slack').Strategy;
const querystring= require('querystring');
const strategy =new SlackStrategy({
  clientID: process.env["SLACK_CLIENT_ID"],
  clientSecret: process.env["SLACK_CLIENT_SECRET"],
  callbackURL: "http://localhost:3000/auth/redirect",
  skipUserProfile: false, 
  user_scope: ['identity.basic', 'identity.email', 'identity.avatar', 'identity.team'] // default
},
function(accessToken, refreshToken, profile, done) {
  return done(null, profile);
}
);
const oauth2 = strategy._oauth2;
oauth2.getOAuthAccessToken = function(code, params, callback) {
  var params= params || {};
  params['client_id'] = oauth2._clientId;
  params['client_secret'] = oauth2._clientSecret;
  var codeParam = (params.grant_type === 'refresh_token') ? 'refresh_token' : 'code';
  params[codeParam]= code;

  var post_data= querystring.stringify( params );
  var post_headers= {
       'Content-Type': 'application/x-www-form-urlencoded'
   };


   oauth2._request("POST", oauth2._getAccessTokenUrl(), post_headers, post_data, null, function(error, data, response) {
    if( error )  callback(error);
    else {
      var results;
      try {
        // As of http://tools.ietf.org/html/draft-ietf-oauth-v2-07
        // responses should be in JSON
        results= JSON.parse( data );
      }
      catch(e) {
        // .... However both Facebook + Github currently use rev05 of the spec
        // and neither seem to specify a content-type correctly in their response headers :(
        // clients of these services will suffer a *minor* performance cost of the exception
        // being thrown
        results= querystring.parse( data );
      }
      var access_token= results["authed_user"]["access_token"];
      var refresh_token= "";
      callback(null, access_token, refresh_token, results); // callback results =-=
    }
  });
}
passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

passport.use(strategy);

export {passport};