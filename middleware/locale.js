// middleware/companyAuth.js
// Middleware functions for locale management
// Created by Daniels Laurinavičs, 2025-01-03.

const i18n = require('i18n');
const DEFAULT_LOCALE = 'lv';

function checkForLocale(locale) {
  const supportedLocales = i18n.getLocales();
  return supportedLocales.includes(locale) ? locale : DEFAULT_LOCALE;
}

function localeMiddleware(req, res, next) {
  const locale = req.cookies?.locale || DEFAULT_LOCALE;
  i18n.setLocale(locale);
  next();
}

/**
 * Set's the user's language to either selected one or the
 * default language. (check DEFAULT_LOCALE)
 */
function setLocale(req, res, next) {
  const locale = req.query?.locale || DEFAULT_LOCALE;
  const checkedLocale = checkForLocale(locale);
  i18n.setLocale(checkedLocale);
  res.cookie('locale', checkedLocale, { maxAge: 365*24*60*60*1000, httpOnly: true });
  
  const referer = req.get('Referer');
  if (referer) return res.redirect(referer);
  else return res.redirect('/');
}

module.exports = { localeMiddleware, setLocale };