const i18n = require('i18n');

const { User } = require('../models/User');
const { Company, CompanyManager } = require('../models/Company');

const validation = require('../utils/validation');

const createCompany = async (req, res) => {
  // Receiving new company's information via the request body.
  const { name, email, phone } = req.body;

  // Defining the errors object used in frontend and starting
  // input validation.
  let ui_errors = { generalError: '', nameError: '',
    emailError: '', phoneError: ''};

  // Checking for empty field values, returns errors
  // if any of the fields are empty.
  if (!name) ui_errors.nameError = i18n.__('errors.ERROR_01');
  if (!email) ui_errors.emailError = i18n.__('errors.ERROR_01');
  if (!phone) ui_errors.phoneError = i18n.__('errors.ERROR_01');
  if (!name || !email || !phone) res.status(400).json(ui_errors);

  // Checking for valid name and email length and return
  // errors if it is longer than 255 characters.
  if (name.length > 255) ui_errors.nameError = i18n.__('errors.ERROR_03');
  if (email.length > 255) ui_errors.emailError = i18n.__('errors.ERROR_03');
  if (name.length > 255 || email.length > 255) {
    res.status(400).json(ui_errors);
  }

  // Checking for valid email and phone format, returns errors
  // if any of them has incorrect format.
  if (!validation.isValidEmail(email)) {
    ui_errors.emailError = i18n.__('errors.ERROR_02');
    res.status(400).json(ui_errors);
  }
  if (!validation.isValidPhone(phone)) {
    ui_errors.phoneError = i18n.__('errors.ERROR_06');
    res.status(400).json(ui_errors);
  }

  try {
    // Creates a new company record and saves it in the database.
    const company = await Company.create({
      name: name,
      email: email,
      phone: phone
    });

    // Sends a success status message
    res.status(201).json({ success: true });
  } catch(error) {
    // Displays an error to the console and sends back
    // the generic error message to the client.
    console.log(error);
    ui_errors.generalError = i18n.__('errors.ERROR_14');
    res.status(500).json(ui_errors);
  }
};

const changeCompanyData = async (req, res) => {

};

const addManager = async (req, res) => {
  const { company_id, user_email } = req.body;
  
  let ui_errors = { generalError: '', userError: ''};
  if (!company_id) return res.status(400);
  if (!user_email) {
    userError = i18n.__('errors.ERROR_01');
    return res.status(400).json(ui_errors);
  }

  if (user_email.length > 255) {
    userError = i18n.__('errors.ERROR_03');
    return res.status(400).json(ui_errors);
  }

  if (!validation.isValidEmail(user_email)) {
    userError = i18n.__('errors.ERROR_02');
    return res.status(400).json(ui_errors);
  }

  if (confirm("CONFIRM_04")) {
    const user = await User.findOne({
      where: { email: user_email }
    });
    if (!user) return res.status(404);

    const relationship = await CompanyManager.create({
      company_id: company_id,
      user_id: user.id
    });

    res.status(201);
  } else {
  }

};

const removeManager = async (req, res) => {

};

const deleteCompany = async (req, res) => {

};

module.exports = {
  createCompany, changeCompanyData, addManager, removeManager, deleteCompany
};