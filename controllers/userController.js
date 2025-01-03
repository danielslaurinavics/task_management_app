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
  // Receiving user credentials via the request body.
  const { emailInput, passwordInput } = req.body;

  const email = emailInput.trim();
  const password = passwordInput.trim();

  // Doing data validation:
  // Required fields - email and password;
  // E-mail length shall not exceed 255 characters,
  // E-mail address should be in format <email>@<domain>.
  const sendError = (status, errorKey) =>
    res.status(status).json({ error: i18n.__(`errors.${errorKey}`) });

  const validations = [
    {condition: !email || !password, error: 'ERR_01'},
    {condition: email.length > 255, error: 'ERR_02'},
    {condition: !validation.isValidEmail(email), error: 'ERR_06'},
  ];
  for (const { condition, error } of validations ) {
    if (condition) return sendError(400, error);
  }

  try {
    // Finding the user in the database and returning
    // an error if the user was not found.
    const user = await User.findOne({
      where: { email: email }
    });
    if (!user) return sendError(404, 'ERR_12');

    // Returning an error if the password is incorrect
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) return sendError(401, 'ERR_12');

    // If the user is marked as blocked, it will return an error.
    if (user.is_blocked) return sendError(403, 'ERR_13');

    // Creating the JWT token and saving it in the cookies.
    const jwtPayload = {
      userId: user.id,
      isAdmin: user.is_admin
    };
    const token = jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.cookie('JWT', token, {
      secure: process.env.COOKIES_SECURE,
      httpOnly: true,
      sameSite: 'Strict',
      maxAge: 3600000
    });

    // Returning success response
    res.status(200).json({ success: true, message: i18n.__('errors.SUC_01') });
  } catch (error) {
    // Logging the error in console and sending a generic error message.
    console.log(error);
    return sendError(500, 'ERR_18');
  }
};



/**
 * Validates the entered information and creates a new user in
 * database if validation is successful.
 * @param {Object} req - Request object containing new user information.
 * @param {Object} res - Response object for sending the result to the client.
 */
const register = async (req, res) => {
  // Receiving user information via the request body.
  const { nameInput, emailInput, phoneInput,
    passwordInput, confirmInput } = req.body;

  const name = nameInput.trim();
  const email = emailInput.trim();
  const phone = phoneInput.trim();
  const password = passwordInput.trim();
  const confirm = confirmInput.trim();

  // Doing data validation:
  // Fields required - name, email, phone number, password and confirmation;
  // Name, email length shall not exceed 255 characters, phone number - 32;
  // E-mail address should be in format <email>@<domain>;
  // Phone numbers should be in format +<code><number>;
  // Password should be at least 8 characters long and its confirmation
  // must match with the written password.
  const sendError = (status, errorKey) =>
    res.status(status).json({ error: i18n.__(`errors.${errorKey}`) });

  const validations = [
    {condition: !name || !email || !phone || !password || !confirm, error: 'ERR_01'},
    {condition: email.length > 255, error: 'ERR_02'},
    {condition: name.length > 255, error: 'ERR_03'},
    {condition: phone.length > 32 , error: 'ERR_05'},
    {condition: !validation.isValidEmail(email), error: 'ERR_06'},
    {condition: !validation.isValidPhone(phone), error: 'ERR_07'},
    {condition: password.length < 8, error: 'ERR_08'},
    {condition: password !== confirm, error: 'ERR_09'},
  ];
  for (const { condition, error } of validations) {
    if (condition) return sendError(400, error);
  }

  try {
    // Checks for an existing user with the same e-mail address as the new one.
    // Returns an error if such user was found, since two accounts with same
    // e-mail address is not allowed.
    const userFound = await User.findOne({
      where: { email: email }
    });
    if (userFound) return sendError(409, 'ERR_11');
    
    // Creates a password hash
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Creates a new database entry
    const newUser = await User.create({
      name: name,
      email: email,
      password: hashedPassword,
      phone: phone
    });

    // Returning success response
    res.status(201).json({ success: true, message: i18n.__('success.SUC_02')});
  } catch (error) {
    // Logging the error in console and sending a generic error message.
    console.error(error);
    return sendError(500, 'ERR_18');
  }
};



/**
 * Logs the user out of the system
 * @param {Object} req - Request object, empty.
 * @param {Object} res - Response object for sending the result to the client.
 */
const logout = async (req, res) => {
  // Deletes the token cookie by setting
  // the expiration date to the past
  res.cookie('token', '', {
    httpOnly: true,
    sameSite: 'Strict',
    secure: process.env.COOKIES_SECURE,
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