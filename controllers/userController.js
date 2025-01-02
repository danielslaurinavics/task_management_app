// Importing thrid-party libraries and middleware
require('dotenv').config();
const i18n = require('i18n');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Importing the user model
const { User } = require('../models/User');

const validation = require('../utils/validation');



/**
 * Validates user credentials and
 * - logs user in in case of successful validation,
 * - otherwise sends error messages to the client and displays in frontend.
 * @param {Object} req - Request object containing user credentials.
 * @param {Object} res - Response object for sending the result to the client.
 */
const login = async (req, res) => {
  // Receiving user credentials via request body.
  const { email, password } = req.body;

  // Defining the errors object used in frontend
  // and checking whether email or password is empty.
  let ui_errors = { generalError: '', emailError: '', passwordError: '' };

  if (!email) ui_errors.emailError = i18n.__('errors.ERROR_01');
  if (!password) ui_errors.passwordError = i18n.__('errors.ERROR_01');
  if (!email || !password) {
    return res.status(400).json(ui_errors);
  }

  if (email.length > 255) {
    ui_errors.emailError = i18n.__('errors.ERROR_03')
    return res.status(400).json(ui_errors);
  }
  if (!validation.isValidEmail(email)) {
    ui_errors.emailError = i18n.__('errors.ERROR_02');
    return res.status(400).json(ui_errors);
  }

  try {
    // Finding the corresponding user and sending
    // an error in case it's not found
    const user = await User.findOne({
      where: { email: email },
      attributes: { include: ['password'] }
    });
    if (!user) {
      ui_errors.generalError = i18n.__('errors.ERROR_08');
      return res.status(401).json(ui_errors);
    }

    // Comparing the password entered and password
    // stored in database. Sends an error if doesn't match.
    const passwordHash = user.password;
    const validPassword = await bcrypt.compare(password, passwordHash);
    if (!validPassword) {
      ui_errors.generalError = i18n.__('errors.ERROR_08');
      return res.status(401).json(ui_errors);
    }

    // Check whether the user is blocked. Sends an error
    // if the user is blocked in the system.
    if (user.is_blocked === true) {
      ui_errors.generalError = i18n.__('errors.ERROR_09');
      return res.status(403).json(ui_errors);
    }

    // In case of successful login, the JWT authentication token is
    // created together with its payload.
    // The token is then placed in the cookies for further use.
    const jwtPayload = { userId: user.id }
    const token = jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'Strict',
      secure: process.env.COOKIES_SECURE,
      maxAge: 3600000
    });

    // Sends an success flag to the client.
    res.status(200).json({ success: true });
  } catch (error) {
    // Displays an error to the console and sends back
    // the generic error message to the client.
    console.error(error);
    ui_errors.generalError = i18n.__('errors.ERROR_14');
    return res.status(500).json(ui_errors);
  }
};



/**
 * Validates the entered information and
 * - creates a user in the database if validation is successful,
 * - otherwise sends error messages to the client and displays in frontend.
 * @param {Object} req - Request object containing new user information.
 * @param {Object} res - Response object for sending the result to the client.
 */
const register = async (req, res) => {
  // Receiving new user's infromation from request body.
  const { name, email, phone, password, password_confirm } = req.body;

  // Defining the errors object, which is used in frontend
  // and doing validation of data received.
  let ui_errors = { generalError: '', nameError: '', emailError: '',
    phoneError: '', passwordError: '', confirmError: '' };
  
  // Checking for missing field values.
  if (!name) ui_errors.nameError = i18n.__('errors.ERROR_01');
  if (!email) ui_errors.emailError = i18n.__('errors.ERROR_01');
  if (!phone) ui_errors.phoneError = i18n.__('errors.ERROR_01');
  if (!password) ui_errors.passwordError = i18n.__('errors.ERROR_01');
  if (!password_confirm) ui_errors.confirmError = i18n.__('errors.ERROR_01');
  if (!name || !email || !phone || !password || !password_confirm) {
    return res.status(400).json(ui_errors);
  }

  // Checking for valid name and email field value length.
  if (name.length > 255) ui_errors.nameError = i18n.__('errors.ERROR_03');
  if (email.length > 255) ui_errors.emailError = i18n.__('errors.ERROR_03');
  if (name.length > 255 || email.length > 255) {
    return res.status(400).json(ui_errors);
  }
  
  // Checking for valid e-mail address and phone number.
  if (!validation.isValidEmail(email)) {
    ui_errors.emailError = i18n.__('errors.ERROR_02');
    return res.status(400).json(ui_errors);
  }
  if (!validation.isValidPhone(phone)) {
    ui_errors.phoneError = i18n.__('errors.ERROR_06');
    return res.status(400).json(ui_errors);
  }

  // Checking for valid password length and that password and its
  // confirmation matches.
  if (password.length < 8) {
    ui_errors.passwordError = i18n.__('errors.ERROR_04');
    return res.status(400).json(ui_errors);
  }

  if (password !== password_confirm) {
    ui_errors.generalError = i18n.__('errors.ERROR_05');
    return res.status(400).json(ui_errors);
  }

  try {
    // Finds an existing user by its e-mail address. Sends
    // an error if a user was found.
    const existingUser = await User.findOne({
      where: { email: email }
    });
    if (existingUser) {
      ui_errors.generalError = i18n.__('errors.ERROR_07');
      return res.status(409).json(ui_errors);
    }

    // Hashes the password by first generating the salt and then hashing it.
    const hashSalt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, hashSalt);

    // Creating a new user and inserting it to the database.
    const newUser = await User.create({
      name: name,
      email: email,
      password: hashedPassword,
      phone: phone,
    });

    // Sends a success message.
    res.status(201).json({ success: i18n.__('success.SUCCESS_01') });
  } catch (error) {
    // Displays an error to the console and sends back
    // the generic error message to the client.
    console.log(error);
    ui_errors.generalError = i18n.__('errors.ERROR_14');
    return res.status(500).json(ui_errors);
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

const changeData = async (req, res) => {

};



/**
 * Blocks the user (bans the user from accessing the system)
 * @param {Object} req - Request object containing the ID of the blocking user.
 * @param {Object} res - Response object for sending the result to the client.
 */
const blockUser = async (req, res) => {
  // Receiving the blocking user's information from the request body
  // and check whether it is provided.
  const { userId } = req.body;
  if (!userId) return res.status(400);

  try {
    // Finds the user to block by its ID, returns an
    // error if the user was not found.
    const user = User.findByPk(userId);
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