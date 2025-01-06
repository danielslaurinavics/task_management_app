require('dotenv').config();
const i18n = require('i18n');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { User } = require('../models/User');
const { Company } = require('../models/Company');
const { Team } = require('../models/Team');
const { TaskList } = require('../models/TaskList');


const validation = require('../utils/validation');
const sequelize = require('../config/database');



/**
 * LIE_01
 * Returns an array of all system's users. Also gives
 * localized messages for use by client-side JavaScript.
 * @param {Object} req - Request object, empty.
 * @param {Object} res - Response object for sending the result to the client.
 */
const getAllUsers = async (req, res) => {
  try {
    const usersData = await User.findAll({ order: [['id', 'ASC']] });
    const users = []
    usersData.forEach(u => {
      users.push({
        id: u.id, name: u.name, email: u.email, phone: u.phone,
        role: u.is_admin ? i18n.__('ui.roles.admin') : i18n.__('ui.roles.user'),
        blocked: u.is_blocked ? i18n.__('ui.yes') : i18n.__('ui.no'),
        admin: u.is_admin, block: u.is_blocked,
        allowed_to: {
          block_word: i18n.__('ui.dashboard.admin.block_user'),
          block_confirm: i18n.__('confirm.CON_03', { user: u.name }),
          unblock_word: i18n.__('ui.dashboard.admin.unblock_user'),
          unblock_confirm: i18n.__('confirm.CON_04', { user: u.name }), 
          delete_word: i18n.__('ui.dashboard.admin.delete_user'),
          delete_confirm: i18n.__('confirm.CON_02', { user: u.name })
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
 * LIE_02
 * Returns an array of all company's managers. Also gives
 * localized messages for use by client-side JavaScript.
 * @param {Object} req - Request object containing the id of the company whose
 * manages should be fetched.
 * @param {Object} res - Response object for sending the result to the client.
 */
const getCompanyUsers = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(id))
      return res.status(400).json({ errors: [i18n.__('errors.ERR_01')] });

    const company = await Company.findByPk(id);
    if (!company)
      return res.status(404).json({ errors: [i18n.__('errors.ERR_19')] });

    const data = await User.findAll({
      include: [
        {
          model: Company,
          attributes: [],
          through: {
            attributes: []
          },
          where: { id: company.id },
          required: true
        }
      ]
    });

    const users = [];
    data.forEach(u => {
      users.push({
        id: u.id, name: u.name, email: u.email, phone: u.phone,
        allowed_to: {
          remove_word: i18n.__('ui.remove'),
          remove_confirm: i18n.__('confirm.CON_07', { user: u.name })
        }
      })
    })

    res.status(200).json({ managers: users });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ errors: [i18n.__('errors.ERR_18')] });
  }
}



/**
 * LIE_03
 * Returns an array of all team's members. Also includes
 * localized messages for client JavaScript handling
 * @param {*} req - Request object containing id of the team for which the
 * members have to be fetched.
 * @param {*} res - Response object for sending the result to the client.
 */
const getTeamUsers = async (req, res) => {
  const { id: team_id } = req.params;

  try {
    if (!team_id || isNaN(team_id))
      return res.status(400).json({errors: [i18n.__('errors.ERR_01')]});

    const team = await Team.findByPk(team_id);
    if (!team)
      return res.status(404).json({errors: [i18n.__('errors.ERR_19')]});

    const data = await User.findAll({
      include: [
        {
          model: Team,
          attributes: ['id'],
          through: {
            attributes: ['is_manager']
          },
          where: { id: team.id },
          required: true
        }
      ]
    });
    const participants = [];
    data.forEach(u => {
      const is_manager = u.Teams[0].TeamParticipant.is_manager;
      participants.push({
        id: u.id, name: u.name, email: u.email, phone: u.phone,
        is_manager: is_manager,
        role: is_manager ? i18n.__('ui.team.roles.manager'): i18n.__('ui.team.roles.participant'),
        allowed_to: {
          elevate_word: i18n.__('ui.team.elevate'),
          lower_word: i18n.__('ui.team.lower'),
          remove_word: i18n.__('ui.remove'),
          elevate_confirm: i18n.__('confirm.CON_11', { user: user.name }),
          lower_confirm: i18n.__('confirm.CON_12', { user: user.name }),
          remove_confirm: i18n.__('confirm.CON_10', { user: user.name })
        }
      });
    });

    res.status(200).json({participants});
  } catch (error) {
    console.error(error);
    res.status(500).json({ errors: [i18n.__('errors.ERR_18')] });
  }
}



/**
 * LIE_04
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
      return res.status(404).json({errors: [i18n.__('errors.ERR_12')]});

    // Checking whether the password is valid.
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.status(401).json({errors: [i18n.__('errors.ERR_12')]});

    // Checking whether the user is blocked.
    if (user.is_blocked)
      return res.status(403).json({errors: [i18n.__('errors.ERR_13')]});

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
    console.error(error);
    res.status(500).json({ errors: [i18n.__('errors.ERR_18')] });
  }
}



/**
 * LIE_05
 * Validates the information entered and creates a new user in
 * database if validation is successful.
 * @param {Object} req - Request object containing new user information.
 * @param {Object} res - Response object for sending the result to the client.
 */
const register = async (req, res) => {
  try {
    // Getting register form field values.
    let { name, email, phone, password, password_confirm } = req.body;

    name = name.trim();
    email = email.trim();
    phone = phone.trim();
    password = password.trim();
    password_confirm = password_confirm.trim();

    // Validation of entered values.
    const errors = [];
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

    // Finding a user, since two users with same e-mail address is not allowed.
    const foundUser = await User.findOne({
      where: { email },
      attributes: ['id']
    });
    if (foundUser)
      return res.status(409).json({ errors: [i18n.__('errors.ERR_11')] });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name: name,
      email: email,
      password: hashedPassword,
      phone: phone
    });

    // Creating a new task list for storing the new user's personal tasks
    const newTaskList = await TaskList.create({ owner_user: newUser.id });

    res.status(201).json({message: i18n.__('success.SUC_02')});
  } catch (error) {
    console.error(error);
    res.status(500).json({ errors: [i18n.__('errors.ERR_18')] });
  }
}



/**
 * LIE_06
 * Logs the user out of the system.
 * @param {Object} req - Request object, empty for this function.
 * @param {Object} res - Response object for sending the result to the client.
 */
const logout = async (req, res) => {
  // Deletes the token cookie by setting the expiration date to the past
  res.cookie('jwt', '', {
    secure: process.env.COOKIES_SECURE === 'yes' ? true : false,
    httpOnly: true,
    sameSite: 'Strict',
    expiresIn: new Date(0)
  });
  res.redirect('/');
};



/**
 * LIE_07
 * Validates the information entered and changes data of an existing user
 * in the database if validation is successful.
 * @param {Object} req - Request object containing new user information.
 * @param {Object} res - Response object for sending the result to the client.
 */
const changeData = async (req, res) => {
  const errors = [];
  try {
    let { id } = req.params;
    let { name, phone, current_password,
      new_password, password_confirm} = req.body;
      
    name = name.trim();
    phone = phone.trim();
    current_password = current_password.trim();
    new_password = new_password.trim();
    password_confirm = password_confirm.trim();

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

    user.name = name;
    user.phone = phone;
    if (new_password.length > 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(new_password, salt);
      user.password = hashedPassword;
    }
    await user.save();

    res.status(200).json({ success: true, message: i18n.__('success.SUC_03') });
  } catch (error) {
    console.error(error);
    res.status(500).json({ errors: [i18n.__('errors.ERR_18')] });
  }
};



/**
 * LIE_08
 * Blocks the user (bans the user from accessing the system).
 * @param {Object} req - Request object containing the ID of the blocking user.
 * @param {Object} res - Response object for sending the result to the client.
 */
const block = async (req, res) => {
    let { id } = req.params;
    if (!id || isNaN(id))
      return res.status(400).json({ errors: [i18n.__('errors.ERR_01')] });

  try {
    const user = await User.findByPk(id);
    if (!user)
      return res.status(404).json({ errors: [i18n.__('errors.ERR_19')] });

    const action = user.is_blocked ? 'unblock' : 'block';
    user.is_blocked = !user.is_blocked;
    await user.save()

    const message = action === 'block' ? i18n.__('success.SUC_04') : i18n.__('success.SUC_05')

    return res.status(200).json({ success: true, message: message});
  } catch (error) {
    console.error(error);
    return res.status(500).json({ errors: [i18n.__('errors.ERR_18')] });
  }
};



/**
 * LIE_09
 * Deletes the user from the system together with its related data.
 * @param {Object} req - Request object containing the ID of the user to delete.
 * @param {Object} res - Response object for sending the result to the client.
 */
const deleteUser = async (req, res) => {
  const t = await sequelize.transaction();
  let { id } = req.params;
  if (!id || isNaN(id))
    return res.status(400).json({ errors: [i18n.__('errors.ERR_01')] });
  
  try {
    const user = await User.findByPk(id);
    if (!user)
      return res.status(404).json({ errors: [i18n.__('errors.ERR_19')] });
    
    await user.destroy({ transaction: t });
    await t.commit();

    res.status(200).json({message: i18n.__('success.SUC_06')});
  } catch (error) {
    // Rolling back the deletion action, outputting the errors to the
    // console and sending a generic internal server error message.
    await t.rollback();
    console.error(error);
    res.status(500).json({ errors: [i18n.__('errors.ERR_18')] });
  }
};

module.exports = {
  getAllUsers, getTeamUsers, getCompanyUsers, 
  login, register, logout, changeData, block, deleteUser
};