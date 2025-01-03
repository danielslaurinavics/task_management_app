// Importing thrid-party libraries and middleware
require('dotenv').config();
const i18n = require('i18n');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Importing the necessary models
const { User } = require('../models/User');
const { CompanyManager } = require('../models/Company');
const { TeamParticipant } = require('../models/Team');
const { Task } = require('../models/Task');

// Importing the validation utility functions
const validation = require('../utils/validation');

// Importing the task list creation functions from task list controller
const { createTaskList, deleteTaskList } = require('./tasklistController');



/**
 * Validates user credentials and logs the user into the
 * system in case of successful validation.
 * @param {Object} req - Request object containing user credentials.
 * @param {Object} res - Response object for sending the result to the client.
 */
const login = async (req, res) => {
  // Defining an errors array in order to store errors that occured
  // during execution of the function. Those errors will be displayed
  // in the frontend as error messages.
  const errors = [];
  try {
    // Getting login form field values.
    let { email, password } = req.body;

    // Sanitizing the input by removing front and rear whitespaces.
    email = email.trim();
    password = password.trim();

    // Validation of entered values.
    const validations = [
      {condition: !email || !password, error: 'ERR_01'},
      {condition: email && email.length > 255, error: 'ERR_02'},
      {condition: email && !validation.isValidEmail(email), error: 'ERR_06'}
    ];
    for (const {condition, error} of validations) {
      if (condition) errors.push(i18n.__(`errors.${error}`));
    }
    if (errors.length > 0) return res.status(400).json({ errors: errors });

    // Searching for the user according to its e-mail address.
    const user = await User.findOne({
      where: { email },
      attributes: ['id', 'password', 'is_blocked']
    });
    if (!user)
      return res.status(404).json({ errors: [i18n.__('errors.ERR_12')] });

    // Checking whether the password is valid.
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.status(401).json({ errors: [i18n.__('errors.ERR_12')] });

    // Checking whether the user is blocked.
    if (user.is_blocked)
      return res.status(403).json({ errors: [i18n.__('errors.ERR_13')] });

    // In case of valid credentials, a JWT authentication token is created and
    // is saved in the cookies of the client.
    const jwtPayload = { userId: user.id };
    const token = jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: '1h'});
    res.cookie('jwt', token, {
      secure: process.env.COOKIES_SECURE === 'yes' ? true : false,
      httpOnly: true,
      sameSite: 'Strict',
      maxAge: 3600000
    });

    // Sending the successful login message.
    res.status(200).json({ success: true, message: i18n.__('success.SUC_01')});
  } catch (error) {
    // Outputting the errors to the console and sending a
    // generic internal server error message to the frontend.
    console.error(error);
    errors.push(i18n.__('errors.ERR_18'));
    res.status(500).json({ errors: errors });
  }
}



/**
 * Validates the entered information and creates a new user in
 * database if validation is successful.
 * @param {Object} req - Request object containing new user information.
 * @param {Object} res - Response object for sending the result to the client.
 */
const register = async (req, res) => {
  const errors = [];
  try {
    // Getting register form field values.
    let { name, email, phone, password, password_confirm } = req.body;

    // Sanitizing the input by removing front and rear whitespaces.
    name = name.trim();
    email = email.trim();
    phone = phone.trim();
    password = password.trim();
    password_confirm = password_confirm.trim();

    // Validation of entered values.
    const validations = [
      {condition: !name || !email || !phone || !password || !password_confirm, error: 'ERR_01'},
      {condition: email && email.length > 255, error: 'ERR_02'},
      {condition: name && name.length > 255, error: 'ERR_03'},
      {condition: phone && phone.length > 32, error: 'ERR_05'},
      {condition: email && !validation.isValidEmail(email), error: 'ERR_06'},
      {condition: phone && !validation.isValidPhone(phone), error: 'ERR_07'},
      {condition: password && password.length < 8, error: 'ERR_08'},
      {condition: password && password !== password_confirm, error: 'ERR_09'}
    ];
    for (const {condition, error} of validations) {
      if (condition) errors.push(i18n.__(`errors.${error}`));
    }
    if (errors.length > 0) return res.status(400).json({ errors: errors });

    // Finding a user, who has a such e-mail address.
    // Two users with the same e-mail address is not allowed.
    const foundUser = await User.findOne({
      where: { email },
      attributes: ['id']
    });
    if (foundUser)
      return res.status(409).json({ errors: [i18n.__('errors.ERR_11')] });

    // Creating a hash of the new user's password.
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Creating a new user entry to the database.
    const newUser = await User.create({
      name: name,
      email: email,
      password: hashedPassword,
      phone: phone
    });

    // Sending the successful registration message.
    res.status(201).json({ success: true, message: i18n.__('success.SUC_02')});
  } catch (error) {
    // Outputting the errors to the console and sending a
    // generic internal server error message to the frontend.
    console.error(error);
    errors.push(i18n.__('errors.ERR_18'));
    res.status(500).json({ errors: errors });
  }
}



/**
 * Logs the user out of the system
 * @param {Object} req - Request object, empty for this function.
 * @param {Object} res - Response object for sending the result to the client.
 */
const logout = async (req, res) => {
  // Deletes the token cookie by setting
  // the expiration date to the past
  res.cookie('jwt', '', {
    secure: process.env.COOKIES_SECURE === 'yes' ? true : false,
    httpOnly: true,
    sameSite: 'Strict',
    expiresIn: new Date(0)
  });
  res.redirect('/');
};



/**
 * Validates the entered information and changes data of an existing user
 * in the database if validation is successful.
 * @param {Object} req - Request object containing new user information.
 * @param {Object} res - Response object for sending the result to the client.
 */
const changeData = async (req, res) => {
  // Receiving user information via the request body.
  const { id, name, phone,
    curr_password, new_password, confirm } = req.body;

  const newName = name.trim();
  const newPhone = phone.trim();
  const currentPassword = curr_password.trim();
  const newPassword = new_password.trim();
  const newConfirm = confirm.trim();

  // Doing data validation:
  // If no data is provided, then the function is returned, since there is
  // nothing to edit.
  if (!newName && !newPhone && !currentPassword && !newPassword && !newConfirm) {
    return res.status(200).json({ success: true });
  }

  const sendError = (status, errorKey) =>
    res.status(status).json({ error: i18n.__(`errors.${errorKey}`) });

  const validations = [
    { condition: newName && newName.length > 255, error: 'ERR_03'},
    { condition: newPhone && newPhone.length > 32, error: 'ERR_05'},
    { condition: newPhone && !validation.isValidPhone(newPhone), error: 'ERR_07'},
    { condition: newPassword && newPassword.length < 8, error: 'ERR_08'},
    { condition: newPassword && newConfirm && newPassword !== newConfirm, error: 'ERR_09'}
  ];
  for (const { condition, error } of validations) {
    if (condition) return sendError(400, error);
  }
  try {
    const user = await User.findByPk(id);
    if (newPassword) {
      const validCurrentPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validCurrentPassword) return sendError(400, 'ERR_10');
    }

    if (newName) user.name = newName;
    if (newPhone) user.phone = newPhone;
    if (newPassword) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      user.password = hashedPassword;
    }
    
    await user.save();
    res.status(200).json({ success: true, message: i18n.__('errors.SUC_03') });
  } catch (error) {
    // Logging the error in console and sending a generic error message.
    console.error(error);
    return sendError(500, 'ERR_18');
  }
};



/**
 * Blocks the user (bans the user from accessing the system)
 * @param {Object} req - Request object containing the ID of the blocking user.
 * @param {Object} res - Response object for sending the result to the client.
 */
const blockUser = async (req, res) => {
  // Receiving the blocking user's information via request body
  // and check whether it is provided.
  const { userId } = req.body;
  if (!userId) return res.status(400);

  try {
    // Finds the user to block by its ID, returns an
    // error if the user was not found.
    const user = await User.findByPk(userId);
    if (!user) return res.status(404);

    // Set the user as blocked and save the changes to the database.
    user.is_blocked = true;
    await user.save();
    res.status(200).json({ message: i18n.__('success.SUCCESS_03') });
  } catch(error) {
    // Log the error in server console and return a
    // generic internal server error message.
    console.error();
    return res.status(500).json({ message: i18n.__('errors.ERROR_14')});
  }
};



/**
 * Unblocks the user (restores right to access the system).
 * @param {*} req - Request object containing the ID of the user to unblock.
 * @param {*} res - Response object for sending the result to the client.
 */
const unblockUser = async (req, res) => {
  // Receiving the unblocking user's information from the request body
  // and check whether it is provided.
  const { userId } = req.body;
  if (!userId) return res.status(400);

  try {
    // Finds the user to block by its ID, returns an
    // error if the user was not found.
    const user = User.findByPk(userId);
    if (!user) return res.status(404);

    // Set the user as unblocked and save the changes to the database.
    user.is_blocked = false;
    await user.save();
    res.status(200).json({ message: i18n.__('success.SUCCESS_04') });
  } catch(error) {
    // Log the error in server console and return a
    // generic internal server error message.
    console.error();
    return res.status(500).json({ message: i18n.__('errors.ERROR_14')});
  }
};

const deleteOwnUser = async (req, res) => {

};

const deleteOtherUser = async (req, res) => {

};



// Exports the controller's function for use by server's routes
module.exports = {
  login, register, logout, changeData,
  blockUser, unblockUser, deleteOwnUser, deleteOtherUser
};