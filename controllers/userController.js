require('dotenv').config();
const i18n = require('i18n');
const bcypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { User } = require('../models/User');


/**
 * Validates user credentials and
 * - logs user in in case of successful validation,
 * - otherwise sends error messages to the client's frontend.
 * @param {Object} req - Request object containing user credentials.
 * @param {Object} res - Response object for sending the result to the client.
 */
const login = async (req, res) => {
  // Receiving user credentials via request body.
  const { email, password } = req.body;

  // Defining the errors object used in frontend
  // and checking whether email or password is empty.
  let ui_errors = {
    generalError: '',
    emailError: '',
    passwordError: ''
  };
  if (!email) ui_errors.emailError = i18n.__('errors.ERROR_01');
  if (!password) ui_errors.passwordError = i18n.__('errors.ERROR_01');
  if (!email || !password) {
    return res.status(400).json(ui_errors);
  }

  if (email.length > 255) {
    ui_errors.emailError = i18n.__('errors.ERROR_03')
  }

  const isValidEmail = (email) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9._%-]+\.[a-zA-Z]{2,}$/;
    regex.test(email);
  }
  if (!isValidEmail(email)) {
    ui_errors.emailError = i18n.__('errors.ERROR_02');
    return res.status(400).json(ui_errors);
  }

  try {
    // Finding the corresponding user and sending
    // an error in case it's not found/
    const user = await User.findOne({
      where: { email: email },
      attributes: {
        include: ['password']
      }
    });
    if (!user) {
      ui_errors.generalError = i18n.__('errors.ERROR_08');
      return res.status(401).json(ui_errors);
    }

    // Comparing the password entered and password
    // stored in database. Sends an error if doesn't match.
    const passwordHash = user.password;
    const validPassword = await bcypt.compare(password, passwordHash);
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

    // Sends an success message.
    res.status(200).json({ success: true });
  } catch (error) {
    // Displays an error to the console and sends back
    // the generic error message to the client.
    console.error(error);
    ui_errors.generalError = i18n.__('errors.ERROR_14');
    return res.status(500).json(ui_errors);
  }
}

const register = async (req, res) => {

}

const logout = async (req, res) => {

}

const changeData = async (req, res) => {

}

const blockUser = async (req, res) => {

}

const unblockUser = async (req, res) => {

}

const deleteOwnUser = async (req, res) => {

}

const deleteOtherUser = async (req, res) => {

}

module.exports = {
  login, register, logout, changeData,
  blockUser, unblockUser, deleteOwnUser, deleteOtherUser
}