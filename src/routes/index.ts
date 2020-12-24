import express from 'express';
const router = express.Router();
import {onlyIfAuthorized} from '../services/auth';

/* GET home page. */
router.get('/', onlyIfAuthorized, function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
