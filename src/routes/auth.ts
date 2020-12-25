import express from 'express';
import request from 'request';
import jwt from 'jsonwebtoken';
import {isLogIn} from '../services/auth';
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  if (isLogIn(req)) {
    res.redirect('/');
    return;
  }
  res.render('login');
});
router.get('/redirect', (req, res) => {
  const code = req.query.code;
  if (!code) {
    res.redirect('/');
    return;
  }
  const options = {
    uri: `https://slack.com/api/oauth.v2.access?code=${code}&client_id=${process.env.SLACK_CLIENT_ID}&client_secret=${process.env.SLACK_CLIENT_SECRET}`,
    method: 'GET'
  };
  request(options, (error, response, body) => {
    const JSONresponse = JSON.parse(body);
    if (!JSONresponse.ok) {
      res.send('Error encountered: \n' + JSON.stringify(JSONresponse)).status(200).end()
      return;
    }
    const oauth = {
      accessToken: JSONresponse.authed_user.access_token
    };
    req.session.oauth = oauth;
    req.session.token = jwt.sign(oauth, process.env.JWT_SECRET!);
    res.redirect('/');
  })
});

router.all('/logout', (req, res) => {
  req.session.token = undefined;
  req.session.oauth = undefined;
  res.redirect('/auth');
});

module.exports = router;