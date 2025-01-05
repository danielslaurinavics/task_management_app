require('dotenv').config();
const jwt = require('jsonwebtoken');
const i18n = require('i18n');

const { User } = require('../models/User');

async function authenticate(req, res, next) {
  const token = req.cookies.jwt;
  if (!token) {
    return res.status(401).render('error', { error: i18n.__('errors.ERR_14')});
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);
    if (!user)
      return res.status(404).render('error', { error: i18n.__('errors.ERR_19')});

    if (user.is_blocked)
      return res.status(403).render('error', { error: i18n.__('errors.ERR_13')});

    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    if (error.name === 'TokenValidationError') {
      return res.status(401).render('error', { error: i18n.__('errors.ERR_14')});
    } else {
      return res.status(403).render('error', { error: i18n.__('errors.ERR_14')});
    }
  }
}



async function authorizeAdmin(req, res, next) {
  if (req.user && req.user.is_admin) return next();
  else return res.status(403).render('error', { error: i18n.__('errors.ERR_14')});
}



async function usersOnly(req, res, next) {
  if (req.user && !req.user.is_admin) return next();
  else return res.status(403).render('error', { error: i18n.__('errors.ERR_14')});
}



async function goToDashboard(req, res, next) {
  if (req.user) {
    if (req.user.is_admin) res.redirect('/admin');
    else res.redirect('/dashboard');
  } else return res.redirect('/');
}



async function redirectIfLoggedIn(req, res, next) {
  const token = req.cookies.jwt;

  if (token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET);
      res.redirect('/home');
    } catch (error) {
      next();
    }
  } else next();
}



module.exports = {
  authenticate, authorizeAdmin, usersOnly,
  goToDashboard, redirectIfLoggedIn
};