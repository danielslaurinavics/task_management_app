// middleware/companyAuth.js
// Middleware functions for authentication
// Created by Daniels Laurinavičs, 2025-01-05.

const i18n = require('i18n');
const { Company, CompanyManager } = require('../models/Company');


/**
 * Checking whether the user has rights to access this company's resources.
 * The user's information is acquired from authenticate() middleware, and
 * company's id is acquired from the parameters of company's page route.
 */
async function checkForAccess(req, res, next) {
  if (!req.user)
    return res.status(401).render('error', {error: i18n.__('msg.E14')});

  const user = req.user;
  const { id: companyId } = req.params;
  if (!companyId || isNaN(companyId))
    return res.status(403).render('error', {error: i18n.__('msg.E20')});

  try {
	const company = await Company.findByPk(companyId);
    if (!company)
      return res.status(404).render('error', {error: i18n.__('msg.E18')});
  
    const companyRelation = await CompanyManager.findOne({
      where: { company_id: companyId, user_id: user.id }
    });
    if (!companyRelation)
      return res.status(403).render('error', {error: i18n.__('msg.E14')});

    req.company = company;
    next();
  } catch (error) { res.status(500).render('error', {error: i18n.__('msg.E16')}); }
}

module.exports = { checkForAccess };