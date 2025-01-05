// Importing thrid-party libraries and middleware.
require('dotenv').config();
const i18n = require('i18n');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Importing necessary models.
const { User } = require('../models/User');
const { TaskList } = require('../models/TaskList');

// Importing validation utility functions.
const validation = require('../utils/validation');

// Importing database connection module.
const sequelize = require('../config/database');



/**
 * Returns an array of all system's users. Also gives
 * localized messages for use by client-side JavaScript.
 * @param {Object} req - Request object, empty.
 * @param {Object} res - Response object for sending the result to the client.
 */
const getAllUsers = async (req, res) => {
  try {
    const usersData = await User.findAll({ order: [['id', 'ASC']] });
    const users = []
    usersData.forEach(user => {
      users.push({
        id: user.id, name: user.name, email: user.email, phone: user.phone,
        role: user.is_admin ? i18n.__('ui.roles.admin') : i18n.__('ui.roles.user'),
        blocked: user.is_blocked ? i18n.__('ui.yes') : i18n.__('ui.no'),
        admin: user.is_admin, block: user.is_blocked,
        allowed_to: {
          block_word: i18n.__('ui.dashboard.admin.block_user'),
          block_confirm: i18n.__('confirm.CON_03', { user: user.name }),
          unblock_word: i18n.__('ui.dashboard.admin.unblock_user'),
          unblock_confirm: i18n.__('confirm.CON_04', { user: user.name }), 
          delete_word: i18n.__('ui.dashboard.admin.delete_user'),
          delete_confirm: i18n.__('confirm.CON_02', { user: user.name })
        }
      });
    });
    res.status(200).json({ users });
  } catch (error) {
    console.log(error);
    return res.status(500).json({errors: [i18n.__('errors.ERR_18')]});
  }
};



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
    // generic internal server error message.
    console.error(error);
    errors.push(i18n.__('errors.ERR_18'));
    res.status(500).json({ errors: errors });
  }
}



/**
 * Validates the information entered and creates a new user in
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

    // Creating a new task list for storing the new user's personal tasks
    const newTaskList = await TaskList.create({ owner_user: newUser.id });

    // Sending the successful registration message.
    res.status(201).json({ success: true, message: i18n.__('success.SUC_02')});
  } catch (error) {
    // Outputting the errors to the console and sending a
    // generic internal server error message.
    console.error(error);
    errors.push(i18n.__('errors.ERR_18'));
    res.status(500).json({ errors: errors });
  }
}



/**
 * Logs the user out of the system.
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
 * Validates the information entered and changes data of an existing user
 * in the database if validation is successful.
 * @param {Object} req - Request object containing new user information.
 * @param {Object} res - Response object for sending the result to the client.
 */
const changeData = async (req, res) => {
  const errors = [];
  try {
    let { id } = req.params;
    // Getting user edit form field values.
    let { name, phone, current_password,
      new_password, password_confirm} = req.body;

    // Sanitizing the input by removing front and rear whitespaces
    name = name.trim();
    phone = phone.trim();
    current_password = current_password.trim();
    new_password = new_password.trim();
    password_confirm = password_confirm.trim();

    // Validation of entered values.
    const validations = [
      {condition: !id || !name || !phone, error: 'ERR_01'},
      {condition: name && name.length > 255, error: 'ERR_03'},
      {condition: phone && phone.length > 32, error: 'ERR_05'},
      {condition: phone && !validation.isValidPhone(phone), error: 'ERR_07'},
      {condition: new_password && new_password.length > 0 && new_password.length < 8, error: 'ERR_08'},
      {condition: new_password && new_password.length > 0 && new_password !== password_confirm, error: 'ERR_09'}
    ];
    for (const {condition, error} of validations) {
      if (condition) errors.push(i18n.__(`errors.${error}`));
    }
    if (errors.length > 0) return res.status(400).json({ errors });

    // Finding the user for who the data will be changed.
    const user = await User.findOne({
      where: { id }, attributes: { include: ['password'] }
    });
    if (!user)
      return res.status(404).json({ errors: [i18n.__('errors.ERR_19')] });

    // Checks the current password entered with the password stored
    // in the database if the password is about to be replaced.
    if (new_password.length > 0) {
      const checkPassword = await bcrypt.compare(current_password, user.password);
      if (!checkPassword)
        return res.status(403).json({ errors: [i18n.__('errors.ERR_10')] });
    }

    // Changing user's data depending on available data.
    // Saving the changed data to the database afterwards.
    user.name = name;
    user.phone = phone;
    if (new_password.length > 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(new_password, salt);
      user.password = hashedPassword;
    }
    await user.save();

    // Sending the successful editing message.
    res.status(200).json({ success: true, message: i18n.__('success.SUC_03') });
  } catch (error) {
    // Outputting the errors to the console and sending a
    // generic internal server error message.
    console.error(error);
    errors.push(i18n.__('errors.ERR_18'));
    res.status(500).json({ errors });
  }
};



/**
 * Blocks the user (bans the user from accessing the system).
 * @param {Object} req - Request object containing the ID of the blocking user.
 * @param {Object} res - Response object for sending the result to the client.
 */
const blockUser = async (req, res) => {
  try {
    // Getting the user id from request parameters and validating it.
    let { id } = req.params;
    if (!id || isNaN(id))
      return res.status(400).json({ errors: [i18n.__('errors.ERR_01')] });

    // Finding the user by its id. Returning an error if no such user was found.
    const user = await User.findByPk(id);
    if (!user)
      return res.status(404).json({ errors: [i18n.__('errors.ERR_19')] });

    // Updating the user blocking status
    user.is_blocked = true;
    await user.save()

    // Sending the successful blocking message.
    return res.status(200).json({ success: true, message: i18n.__('success.SUC_04')});
  } catch (error) {
    // Outputting the errors to the console and sending a
    // generic internal server error message.
    console.error(error);
    return res.status(500).json({ errors: [i18n.__('errors.ERR_18')] });
  }
};



/**
 * Unblocks the user (restores right to access the system).
 * @param {Object} req - Request object containing the ID of the user to unblock.
 * @param {Object} res - Response object for sending the result to the client.
 */
const unblockUser = async (req, res) => {
  try {
    // Getting the user id from request parameters and validating it.
    let { id } = req.params;
    if (!id || isNaN(id))
      return res.status(400).json({ errors: [i18n.__('errors.ERR_01')] });

    // Finding the user by its id . Returns an error if no such user was found.
    const user = await User.findByPk(id);
    if (!user)
      return res.status(404).json({ errors: [i18n.__('errors.ERR_19')] });

    // Updating the user blocking status
    user.is_blocked = false;
    await user.save()

    // Sending the successful blocking message.
    return res.status(200).json({ success: true, message: i18n.__('success.SUC_05')});
  } catch (error) {
    // Outputting the error to the console and sending a
    // generic internal server error message.
    console.error(error);
    return res.status(500).json({ errors: [i18n.__('errors.ERR_18')] });
  }
};



/**
 * Deletes themselves from the system and also deletes all user-related data.
 * @param {Object} req - Request object containing the ID of the user to delete.
 * @param {Object} res - Response object for sending the result to the client.
 */
const deleteSelf = async (req, res) => {
  // Creating a transaction for a possibility of rollback if any errors occur.
  const t = await sequelize.transaction();
  try {
    // Getting the user id from request parameters and validating the input
    let { id } = req.params;
    if (!id || isNaN(id))
      return res.status(400).json({ errors: [i18n.__('errors.ERR_01')] });

    // Finding the user by its id and returning an
    // if such user wasn't found.
    const user = await User.findByPk(id);
    if (!user)
      return res.status(404).json({ errors: [i18n.__('errors.ERR_19')] });
    
    // Deleting the user and its data
    // All user-related data will also be deleted, including its personal
    // task list and its tasks, and also participation records in
    // teams, comapnies and team tasks.
    await user.destroy({ transaction: t });
    await t.commit();

    // Logs the user out of the system and redirects it
    // to the homepage
    res.cookie('jwt', '', {
      secure: process.env.COOKIES_SECURE,
      httpOnly: true,
      sameSite: 'Strict',
      expiresIn: new Date(0)
    });
    res.status(200).json({ success: true, message: i18n.__('success.SUC_06') })
  } catch (error) {
    // Rolling back the deletion action, outputting the errors to the
    // console and sending a generic internal server error message.
    await t.rollback();
    console.error(error);
    res.status(500).json({ errors: [i18n.__('errors.ERR_18')] });
  }
}



/**
 * Deletes the user from the system together with its related data.
 * @param {Object} req - Request object containing the ID of the user to delete.
 * @param {Object} res - Response object for sending the result to the client.
 */
const deleteUser = async (req, res) => {
  // Creating a transaction for a possibility of rollback if any errors occur.
  const t = await sequelize.transaction();
  try {
    // Getting the user id from request parameters and validating the input
    let { id } = req.params;
    if (!id || isNaN(id))
      return res.status(400).json({ errors: [i18n.__('errors.ERR_01')] });

    // Finding the user by its id and returning an
    // if such user wasn't found.
    const user = await User.findByPk(id);
    if (!user)
      return res.status(404).json({ errors: [i18n.__('errors.ERR_19')] });
    
    // Deleting the user and its data
    // All user-related data will also be deleted, including its personal
    // task list and its tasks, and also participation records in
    // teams, comapnies and team tasks.
    await user.destroy({ transaction: t });
    await t.commit();

    // Sending the successful deletion message.
    res.status(200).json({ success: true, message: i18n.__('success.SUC_06') });
  } catch (error) {
    // Rolling back the deletion action, outputting the errors to the
    // console and sending a generic internal server error message.
    await t.rollback();
    console.error(error);
    res.status(500).json({ errors: [i18n.__('errors.ERR_18')] });
  }
};

module.exports = {
  getAllUsers, login, register, logout, changeData,
  blockUser, unblockUser, deleteSelf, deleteUser
};