// controllers/companyController.js
// Company module/controller functions.
// Created by Daniels Laurinavičs, 2025-01-02.

const i18n = require('i18n');

const { User } = require('../models/User');
const { Company, CompanyManager } = require('../models/Company');

const validation = require('../utils/validation');
const sequelize = require('../config/database');


/**
 * UZN_01
 * Returns an array of all companies registered in the system.
 * Also adds localized messages for use by client-side JavaScript.
 */
const getAllCompanies = async (req, res) => {
  try {
    const companyData = await Company.findAll({ order: [['id', 'ASC']] });
    const companies = []
    companyData.forEach(c => {
      companies.push({
        id: c.id, name: c.name, email: c.email, phone: c.phone,
        allowed_to: {
          add_prompt: i18n.__('ui.dashboard.admin.add_to_company_prompt'),
          add_confirm: i18n.__('msg.C06', { user: '%user', company: c.name }),
          delete_confirm: i18n.__('msg.C05', { name: c.name }),
        }
      });
    })
    res.status(200).json({ companies });
  } catch (error) {
    console.log(error);
    return res.status(500).json({errors: [i18n.__('msg.E16')]});
  }
}


/**
 * UZN_02
 * Creates a new company and saves it to the database.
 */
const createCompany = async (req, res) => {
  let { name, email, phone } = req.body;
  
  try {
    name = name.trim();
    email = email.trim();
    phone = phone.trim();

    const errors = []
    const validations = [
      {condition: !name || !email || !phone, error: 'E01'},
      {condition: email && email.length > 255, error: 'E02'},
      {condition: name && name.length > 255, error: 'E04'},
      {condition: phone && phone.length > 32, error: 'E05'},
      {condition: email && !validation.isValidEmail(email), error: 'E06'},
      {condition: phone && !validation.isValidPhone(phone), error: 'E07'}
    ];
    for (const {condition, error} of validations) {
      if (condition) errors.push(i18n.__(`msg.${error}`));
    }
    if (errors.length > 0) return res.status(400).json({ errors });

    const newCompany = await Company.create({ name, email, phone });
    
    res.status(201).json({success: true, message: i18n.__('msg.S06')});
  } catch (error) {
    console.error(error);
    res.status(500).json({ errors: [i18n.__('msg.E16')] });
  }
};


/**
 * UZN_03
 * Changes data of an already existing company.
 */
const changeCompanyData = async (req, res) => {
  let { id } = req.params;
  let { name, description, email, phone} = req.body;
  
  try {
    name = name.trim();
    description = description.trim();
    email = email.trim();
    phone = phone.trim();

    const errors = [];
    const validations = [
      {condition: !id || isNaN(id), error: 'E20'},
      {condition: !name || !description || !email || !phone, error: 'E01'},
      {condition: email && email.length > 255, error: 'E02'},
      {condition: name && name.length > 255, error: 'E04'},
      {condition: phone && phone.length > 32, error: 'E05'},
      {condition: email && !validation.isValidEmail(email), error: 'E06'},
      {condition: phone && !validation.isValidPhone(phone), error: 'E07'},
    ];
    for (const {condition, error} of validations) {
      if (condition) errors.push(i18n.__(`msg.${error}`));
    }
    if (errors.length > 0) return res.status(400).json({ errors });

    const company = await Company.findByPk(id);
    if (!company)
      return res.status(404).json({ errors: [i18n.__('msg.S18')] });

    company.name = name;
    company.description = description;
    company.email = email;
    company.phone = phone;

    await company.save();
    
    res.status(200).json({ success: true, message: i18n.__('msg.S07') });
  } catch (error) {
    console.error(error);
    res.status(500).json({ errors: [i18n.__('msg.E16')] });
  }
};


/**
 * UZN_04
 * Deletes the company and all of its related data from the database.
 */
const deleteCompany = async (req, res) => {
  let { id } = req.params;
  if (!id || isNaN(id))
    return res.status(400).json({ errors: [i18n.__(`msg.E20`)] });
  
  try {
    const t = await sequelize.transaction();
    
    const company = await Company.findByPk(id);
    if (!company)
      return res.status(404).json({ errors: [i18n.__('msg.E18')] });

    await company.destroy({transaction: t});
    await t.commit();

    res.status(200).json({ success: true, message: i18n.__('msg.S10') });
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ errors: [i18n.__('msg.E16')] });
  }
};



/**
 * UZN_05
 * Adds a company manager role to a user. This role is added only to
 * a specific company and not for all companies.
 */
const addManager = async (req, res) => {
  let { id } = req.params;
  let { email } = req.body;
  
  try {
    email = email.trim();

    const errors = [];
    const validations = [
      {condition: !id || isNaN(id) || !email, error: 'E20'},
      {condition: email && email.length > 255 || !email, error: 'E02'},
      {condition: email && !validation.isValidEmail(email) || !email, error: 'E06'}
    ];
    for (const {condition, error} of validations) {
      if (condition) errors.push(i18n.__(`msg.${error}`));
    }
    if (errors.length > 0) return res.status(400).json({ errors });

    const company = await Company.findByPk(id);
    const user = await User.findOne({ where: { email } });
    if (!company || !user)
      return res.status(404).json({ errors: [i18n.__('msg.E18')] });

    const existingManager = await CompanyManager.findOne({
      where: { company_id: company.id, user_id: user.id}
    });
    if (existingManager)
      return res.status(409).json({ errors: [i18n.__('msg.E19')] });
    
    const newManager = await CompanyManager.create({
      company_id: company.id,
      user_id: user.id
    });

    res.status(201).json({ success: true, message: i18n.__('msg.S08')});
  } catch (error) {
    console.error(error);
    res.status(500).json({ errors: [i18n.__('msg.E16')] });
  }
};


/**
 * UZN_06
 * Deletes the company manager role from the user.
 */
const removeManager = async (req, res) => {
  let { id } = req.params;
  let { userId } = req.body;
  if (!id || isNaN(id)) 
    return res.status(400).json({ errors: [i18n.__('msg.E20')] });
  
  try {
    const t = await sequelize.transaction();

    const companyManager = await CompanyManager.findOne({
      where: { company_id: id, user_id: userId}
    });
    if (!companyManager)
      return res.status(404).json({ errors: [i18n.__('msg.E18')] });

    await companyManager.destroy({transaction: t});
    await t.commit()

    res.status(200).json({ success: true, message: i18n.__('msg.S09')});
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ errors: [i18n.__('msg.E16')] });
  }
};


/**
 * Gets an array of all companies in which the user is a manager.
 */
const getUserCompanies = async (req, res) => {
  const { id: user_id } = req.params;
  if (!user_id || isNaN(user_id))
    return res.status(400).json({ errors: [i18n.__('msg.E20')] });

  try {
    const user = await User.findByPk(user_id);
    if (!user)
      return res.status(404).json({ errors: [i18n.__('msg.E18')] });

    const companies = await Company.findAll({
      include: [
        {
          model: User,
          attributes: [],
          through: { attributes: [] },
          where: { id: user_id },
          required: true
        }
      ]
    });

    res.status(200).json({ companies });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ errors: [i18n.__('msg.E16')] });
  }
}

module.exports = {
  getAllCompanies, createCompany, changeCompanyData,
  deleteCompany, addManager, removeManager, getUserCompanies
};