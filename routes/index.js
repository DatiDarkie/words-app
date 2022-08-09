const { Router, application } = require("express");
const router = Router();
const configData = require('../config');

module.exports = function (qb) {
  router.get('/', checkLogin, (req, res) => {
    res.render('index', {
      ...configData
    });
  });

  router.get('/login', (req, res) => {
    if (req.session.user) {
      return res.redirect(req.query.r || '/');
    }

    res.render('login');
  });

  router.post('/login', (req, res) => {
    if (req.session.user) {
      return res.redirect(req.query.r || '/');
    }

    let { username, password } = req.body,
        query = qb.select('*').from('users').where('username', username),
        message = '';

    query.exec().then(userData => {
      if (!userData[0]) {
        message = 'Invalid username!';
      } else if (userData[0].password !== password) {
        message = 'Invalid password!';
      }
  
      if (message !== '') {
        return res.render('login', {
          errorMessage: message,
          username
        });
      }
  
      req.session.user = userData[0];
      
      return res.redirect(req.query.r || '/');
    });
  });

  router.use('/api', require('./api')(qb));

  router.get('*', (req, res) => {
    res.render('404', {
      ...configData
    });
  });

  function checkLogin(req, res, next) {
    if (req.session.user) {
      return next();
    } else {
      return res.redirect('/login?r=' + req.path);
    } 
  }

  return router;
}