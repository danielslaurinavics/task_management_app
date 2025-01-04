const i18n = require('i18n');

const { User } = require('../models/User');
const { Company, CompanyManager } = require('../models/Company');

const validation = require('../utils/validation');
const sequelize = require('../config/database');




const getUserCompanies = async (req, res) => {
  const errors = [];
  try {
    // Getting User ID from the request parameters and then validating
    // the input. user_id must be an integer
    const { user_id } = req.params;
    if (!user_id || isNaN(user_id))
      return res.status(400).json({ errors: [i18n.__('errors.ERR_01')] });

    // Finds a user with such ID. Returns an error if no such user
    // was found in the database.
    const user = await User.findByPk(user_id);
    if (!user)
      return res.status(404).json({ errors: [i18n.__('errors.ERR_19')] });

    // Search for the companies in which the user is manager.
    const companies = await Company.findAll({
      include: [
        {
          model: User,
          attributes: [],
          through: {
            attributes: []
          },
          where: { id: user_id },
          required: true
        }
      ]
    });

    // Returns the companies array to client.
    res.status(200).json({ companies });
  } catch (error) {
    // Outputting the errors to the console and sending a
    // generic internal server error message.
    console.log(error);
    errors.push(i18n.__('errors.ERR_18'));
    return res.status(500).json({ errors });
  }
}



/**
 * Creates a new company and saves it to the database.
 * @param {Object} req - Request object containing new company's information.
 * @param {Object} res - Response object for sending the result to the client.
 */
const createCompany = async (req, res) => {
  const errors = [];
  try {
    // Getting creation form field values.
    let { name, email, phone } = req.body;
    
    // Sanitizing the input by removing front and rear whitespaces.
    name = name.trim();
    email = email.trim();
    phone = phone.trim();

    // Validation of entered values.
    const validations = [
      {condition: !name || !email || !phone, error: 'ERR_01'},
      {condition: email && email.length > 255, error: 'ERR_02'},
      {condition: name && name.length > 255, error: 'ERR_04'},
      {condition: phone && phone.length > 32, error: 'ERR_05'},
      {condition: email && !validation.isValidEmail(email), error: 'ERR_06'},
      {condition: phone && !validation.isValidPhone(phone), error: 'ERR_07'}
    ];
    for (const {condition, error} of validations) {
      if (condition) errors.push(i18n.__(`errors.${error}`));
    }
    if (errors.length > 0) return res.status(400).json({ errors });

    // Creating a new company entry in the database.
    const newCompany = await Company.create({ name, email, phone });
    
    // Sending the successful creation message.
    res.status(201).json({success: true, message: i18n.__('success.SUC_07')});
  } catch (error) {
    // Outputting the errors to the console and sending a
    // generic internal server error message.
    console.error(error);
    errors.push(i18n.__('errors.ERR_18'));
    res.status(500).json({ errors: errors });
  }
};



/**
 * Changes data of an already existing company.
 * @param {Object} req - Request object containing updated company's information.
 * @param {Object} res - Response object for sending the result to the client.
 */
const changeCompanyData = async (req, res) => {
  const errors = [];
  try {
    // Getting company id valudes
    let { id } = req.params;
    // Getting company edit form field values
    let { name, description, email, phone} = req.body;

    // Sanitizing input by removing whitspaces from both ends of the string
    // and converting ids to integer.
    id = parseInt(id.trim(), 10);
    name = name.trim();
    description = description.trim();
    email = email.trim();
    phone = phone.trim();

    // Validation of values entered.
    const validations = [
      {condition: !id || isNaN(id), error: 'ERR_01'},
      {condition: !name || !description || !email || !phone, error: 'ERR_01'},
      {condition: email && email.length > 255, error: 'ERR_02'},
      {condition: name && name.length > 255, error: 'ERR_04'},
      {condition: phone && phone.length > 32, error: 'ERR_05'},
      {condition: email && !validation.isValidEmail(email), error: 'ERR_06'},
      {condition: phone && !validation.isValidPhone(phone), error: 'ERR_07'},
    ];
    for (const {condition, error} of validations) {
      if (condition) errors.push(i18n.__(`errors.${error}`));
    }
    if (errors.length > 0) return res.status(400).json({ errors });

    // Searching the company for which the data must be changed. Returns
    // an error if no such company was found in the database.
    const company = await Company.findByPk(id);
    if (!company)
      return res.status(404).json({ errors: [i18n.__('errors.ERR_19')] });

    // Setting the company's database entry
    // attributes to their updated values.
    company.name = name;
    company.description = description;
    company.email = email;
    company.phone = phone;

    // Saving the changes to the database
    await company.save();
    
    // Sending the successful creation message.
    res.status(200).json({ success: true, message: i18n.__('success.SUC_08') });
  } catch (error) {
    // Outputting the errors to the console and sending a
    // generic internal server error message.
    console.error(error);
    errors.push(i18n.__('errors.ERR_18'));
    res.status(500).json({ errors: errors });
  }
};



/**
 * Adds a company manager role to a user. This only affects the company
 * for which the user is added to.
 * @param {Object} req - Request object containing information about the company to
 * which the user will be added and the user's e-mail address.
 * @param {Object} res - Response object for sending the result to the client.
 */
const addManager = async (req, res) => {
  const errors = [];
  try {
    // Getting company ID and add manager form field values.
    let { id } = req.params;
    let { email } = req.body;

    // Sanitizing the input by removing front and rear whitespaces,
    // and turning ids into numbers.
    id = parseInt(id.trim(), 10);
    email = email.trim();

    // Validation of entered values.
    const validations = [
      {condition: !id || isNaN(id) || !email, error: 'ERR_01'},
      {condition: email && email.length > 255 || !email, error: 'ERR_02'},
      {condition: email && !validation.isValidEmail(email) || !email, error: 'ERR_06'}
    ];
    for (const {condition, error} of validations) {
      if (condition) errors.push(i18n.__(`errors.${error}`));
    }
    if (errors.length > 0) return res.status(400).json({ errors });

    // Checking whether the company or the user who is to be added exists
    // in the database. Returns an error if it doesn't.
    const company = await Company.findByPk(id);
    const user = await User.findOne({ where: { email } });
    if (!company || !user)
      return res.status(404).json({ errors: [i18n.__('errors.ERR_19')] });

    // Creating a new company manager entry in the database
    const newManager = await CompanyManager.create({
      company_id: company.id,
      user_id: user.id
    });

    // Sending the successful addition message.
    res.status(201).json({ success: true, message: i18n.__('success.SUC_09')});
  } catch (error) {
    // Outputting the errors to the console and sending a
    // generic internal server error message.
    console.error(error);
    errors.push(i18n.__('errors.ERR_18'));
    res.status(500).json({ errors: errors });
  }
};



/**
 * Deletes the company manager role from the user.
 * @param {Object} req - Request object containing the ID of the company and the ID
 * of the manager for who the manager entry must be deleted.
 * @param {Object} res - Response object for sending the result to the client.
 */
const removeManager = async (req, res) => {
  const errors = [];
  const t = await sequelize.transaction();
  try {
    // Getting company ID and add manager form field values.
    let { id } = req.params;
    let { userId } = req.body;

    // Sanitizing the input by turning ids to numbers.
    id = parseInt(id.trim(), 10);
    userId = parseInt(userId.trim(), 10);

    // Validation of entered values.
    if (!id || isNaN(id)) errors.push(i18n.__('errors.ERR_01'));
    if (errors.length > 0) return res.status(400).json({ errors });

    // Searching for the exact company manager record in the database.
    // Returns an error if it doesn't find one.
    const companyManager = await CompanyManager.findOne({
      where: { company_id: id, user_id: userId}
    });
    if (!companyManager)
      return res.status(404).json({ errors: [i18n.__('errors.ERR_19')] });

    // Deleting the manager entry from the database and commit changes.
    companyManager.destroy();
    await t.commit()

    // Sending the successful removal message.
    res.status(200).json({ success: true, message: i18n.__('success.SUC_10')});
  } catch (error) {
    // Rolling back the deletion action, outputting the errors to the
    // console and sending a generic internal server error message.
    await t.rollback();
    console.error(error);
    errors.push(i18n.__('errors.ERR_18'));
    res.status(500).json({ errors: errors });
  }
};



/**
 * Deletes the company and all of its related data from the database
 * @param {Object} req - Request object containing the ID of the company to delete.
 * @param {Object} res - Response object for sending the result to the client.
 */
const deleteCompany = async (req, res) => {
  const errors = [];
  const t = await sequelize.transaction();
  try {
    // Getting company ID from request parameters
    let { id } = req.params;

    // Sanitizing input by turning ids to numbers.
    id = parseInt(id.trim(), 10);

    // Validation of entered values.
    if (!id || isNaN(id)) errors.push(i18n.__(`errors.ERR_01`));
    if (errors.length > 0) return res.status(400).json({ errors });

    // Find the company by its id. Return an error if not found.
    const company = await Company.findByPk(id);
    if (!company)
      return res.status(404).json({ errors: [i18n.__('errors.ERR_19')] });

    // Deleting the company and commiting the action to the database.
    await company.destroy();
    await t.commit();

    // Sending the successful deletion message.
    res.status(200).json({ success: true, message: i18n.__('success.SUC_11') });
  } catch (error) {
    // Rolling back the deletion action, outputting the errors to the
    // console and sending a generic internal server error message.
    await t.rollback();
    console.error(error);
    errors.push(i18n.__('errors.ERR_18'));
    res.status(500).json({ errors: errors });
  }
};

module.exports = {
  createCompany, getUserCompanies, changeCompanyData,
  addManager, removeManager, deleteCompany
};