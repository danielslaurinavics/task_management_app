// middleware/auth.js
// Middleware functions for authentication
// Created by Daniels Laurinavičs, 2025-01-02.

require('dotenv').config();
const jwt = require('jsonwebtoken');
const i18n = require('i18n');

const { User } = require('../models/User');
const { TaskList } = require('../models/TaskList');


/**
 * Checking whether the user is authenticated and has the rights to
 * access system's resources. The authentication token is stored in
 * the client's cookies.
 * If the user is not having a valid token or is blocked, it will display an
 * error on the screen, otherwise user's data together with its task list
 * data (if has one) is handed to next middleware or controller function.
 */
async function authenticate(req, res, next) {
  // Fetch the authentication cookie.
  const token = req.cookies.jwt;
  if (!token) {
    return res.status(401).render('error', { error: i18n.__('msg.E14')});
  }

  // Checks whether the cookie is valid
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);
    if (!user)
      return res.status(404).render('error', { error: i18n.__('msg.E18')});

    if (user.is_blocked)
      return res.status(403).render('error', { error: i18n.__('msg.E13')});

    const taskList = await TaskList.findOne({ where: { owner_user: user.id } });
    
    req.user = user;
    if (taskList) req.user.list_id = taskList.id;
    next();
  } catch (error) { return res.status(403).render('error', { error: i18n.__('msg.E14')}); }
}


/**
 * Checks user's data acquired from the authenticate() middleware whether
 * he is an administrator or not.
 * If the user is not an administrator, it will display an error in the screen.
 */
async function authorizeAdmin(req, res, next) {
  if (req.user && req.user.is_admin) return next();
  else return res.status(403).render('error', { error: i18n.__('msg.E14')});
}


/**
 * Checks user's data acquired from the authenticate() middleware whether
 * he is a regular user or not.
 * If the user is an admin, it will display an error in the screen.
 */
async function usersOnly(req, res, next) {
  if (req.user && !req.user.is_admin) return next();
  else return res.status(403).render('error', { error: i18n.__('errors.ERR_14')});
}


/**
 * Redirects to appropriate dashboard route depending on user's role.
 */
async function goToDashboard(req, res, next) {
  if (req.user) {
    if (req.user.is_admin) res.redirect('/admin');
    else res.redirect('/dashboard');
  } else return res.redirect('/');
}


/**
 * Redirects the user to the dashboard route if the user is logged in,
 * otherwise he is redirected to the next page or function.
 * Used on login and register routes in order for authenticated users
 * to bypass login/registration if they access them. 
 */
async function redirectIfLoggedIn(req, res, next) {
  const token = req.cookies.jwt;

  if (token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET);
      res.redirect('/home');
    } catch (error) { next(); }
  } else next();
}

module.exports = {
  authenticate, authorizeAdmin, usersOnly,
  goToDashboard, redirectIfLoggedIn
};