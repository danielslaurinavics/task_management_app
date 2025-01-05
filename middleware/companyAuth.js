const i18n = require('i18n');

const { Company, CompanyManager } = require('../models/Company');
const { authorizeAdmin } = require('./auth');



async function checkForAccess(req, res, next) {
  if (!req.user)
    return res.status(401).render('error', {error: i18n.__('errors.ERR_14')});

  const user = req.user;
  const { id: companyId } = req.params;
  if (!companyId || isNaN(companyId))
    return res.status(403).render('error', {error: i18n.__('errors.ERR_01')});

  try {
    const companyRelation = await CompanyManager.findOne({
      where: { company_id: companyId, user_id: user.id }
    });
    if (!companyRelation)
      return res.status(403).render('error', {error: i18n.__('errors.ERR_14')});

    const company = await Company.findByPk(companyId);
    if (!company)
      return res.status(404).render('error', {error: i18n.__('errors.ERR_19')});

    req.company = company;
    next();
  } catch (error) {
    console.error(error);
    res.status(500).render('error', {error: i18n.__('errors.ERR_18')});
  }
}



async function checkForAccessOrAdmin(req, res, next) {
  try {
    await checkForAccess(req, res, next);
    return next();
  } catch (error) {
    try {
      await authorizeAdmin(req, res, next);
      return next();
    } catch (error) {
      return res.status(403).render('error', {error: i18n.__('errors.ERR_14')});
    }
  }
}

module.exports = { checkForAccess, checkForAccessOrAdmin };