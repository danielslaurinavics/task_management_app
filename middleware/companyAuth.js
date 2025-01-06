const i18n = require('i18n');
const { Company, CompanyManager } = require('../models/Company');

async function checkForAccess(req, res, next) {
  if (!req.user)
    return res.status(401).render('error', {error: i18n.__('msg.E14')});

  const user = req.user;
  const { id: companyId } = req.params;
  if (!companyId || isNaN(companyId))
    return res.status(403).render('error', {error: i18n.__('msg.E20')});

  try {
    const companyRelation = await CompanyManager.findOne({
      where: { company_id: companyId, user_id: user.id }
    });
    if (!companyRelation)
      return res.status(403).render('error', {error: i18n.__('msg.E14')});

    const company = await Company.findByPk(companyId);
    if (!company)
      return res.status(404).render('error', {error: i18n.__('msg.E18')});

    req.company = company;
    next();
  } catch (error) {
    console.error(error);
    res.status(500).render('error', {error: i18n.__('msg.E16')});
  }
}

module.exports = { checkForAccess };