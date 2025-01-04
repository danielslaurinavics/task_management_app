require('dotenv').config();
const jwt = require('jsonwebtoken');
const i18n = require('i18n');

const { User } = require('../models/User');
const { Company, CompanyManager } = require('../models/Company');

async function checkForAccess(req, res, next) {
  let { companyId } = req.params;
  let user = req.user;

  if (!companyId)
    return res.status(400).json({ error: i18n.__('errors.ERR_14') });
  if (!user)
    return res.status(401).json({ error: i18n.__('errors.ERR_14') });
  
  companyId = parseInt(companyId.trim(), 10);
  if (!companyId || isNaN(companyId))
    return res.status(401)
}


async function checkForAccessAdmin(req, res, next) {

}