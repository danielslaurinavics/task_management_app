const i18n = require('i18n');

const { Company, CompanyManager } = require('../models/Company');

async function checkForAccess(req, res, next) {
  const user = req.user;
  const { id } = req.params;
  if (!id || isNaN(id))
    return res.status(403).render('error', {error: i18n.__('errors.ERR_14')});

  try {
    const companyRelation = await CompanyManager.findOne({
      where: { company_id: id, user_id: user.id }
    });
    if (!companyRelation)
      return res.status(403).render('error', {error: i18n.__('errors.ERR_14')});

    const company = await Company.findByPk(id);
    if (!company)
      return res.status(404).render('error', {error: i18n.__('errors.ERR_19')});

    req.company = company;
    next();
  } catch (error) {
    console.error(error);
    res.status(500).render('error', {error: i18n.__('errors.ERR_18')});
  }
}

module.exports = { checkForAccess };