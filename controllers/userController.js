// controllers/userController.js
// User module/controller functions.
// Created by Daniels Laurinavičs, 2025-01-02.

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
          block_confirm: i18n.__('msg.C03', { user: u.name }),
          unblock_word: i18n.__('ui.dashboard.admin.unblock_user'),
          unblock_confirm: i18n.__('msg.C04', { user: u.name }), 
          delete_confirm: i18n.__('msg.C02', { user: u.name })
        }
      });
    });
    res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({errors: [i18n.__('msg.E16')]});
  }
};


/**
 * LIE_02
 * Returns an array of all company's managers. Also gives
 * localized messages for use by client-side JavaScript.
 */
const getCompanyUsers = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(id))
      return res.status(400).json({ errors: [i18n.__('msg.E20')] });

    const company = await Company.findByPk(id);
    if (!company)
      return res.status(404).json({ errors: [i18n.__('msg.E18')] });

    const usersData = await User.findAll({
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
    usersData.forEach(u => {
      users.push({
        id: u.id, name: u.name, email: u.email, phone: u.phone,
        allowed_to: { remove_confirm: i18n.__('msg.C07', { user: u.name }) }
      })
    })
    res.status(200).json({ managers: users });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ errors: [i18n.__('msg.E16')] });
  }
}


/**
 * LIE_03
 * Returns an array of all team's members. Also includes
 * localized messages for client JavaScript handling
 */
const getTeamUsers = async (req, res) => {
  const { id: team_id } = req.params;

  try {
    if (!team_id || isNaN(team_id))
      return res.status(400).json({errors: [i18n.__('msg.E20')]});

    const team = await Team.findByPk(team_id);
    if (!team)
      return res.status(404).json({errors: [i18n.__('msg.E18')]});

    const usersData = await User.findAll({
      include: [
        {
          model: Team,
          attributes: ['id'],
          through: { attributes: ['is_manager'] },
          where: { id: team.id },
          required: true
        }
      ]
    });
    const users = [];
    usersData.forEach(u => {
      const is_manager = u.Teams[0].TeamParticipant.is_manager;
      users.push({
        id: u.id, name: u.name, email: u.email, phone: u.phone, is_manager: is_manager,
        role: is_manager ? i18n.__('ui.team.roles.manager'): i18n.__('ui.team.roles.participant'),
        allowed_to: {
          elevate_confirm: i18n.__('msg.C11', { user: u.name }),
          lower_confirm: i18n.__('msg.C12', { user: u.name }),
          remove_confirm: i18n.__('msg.C10', { user: u.name })
        }
      });
    });
    res.status(200).json({participants: users});
  } catch (error) {
    console.error(error);
    res.status(500).json({ errors: [i18n.__('msg.E16')] });
  }
}


/**
 * LIE_04
 * Validates user credentials and logs the user into the
 * system in case of successful validation.
 */
const login = async (req, res) => {
  try {
    let { email, password } = req.body;

    email = email.trim();
    password = password.trim();

    const errors = [];
    const validations = [
      {condition: !email || !password, error: 'E01'},
      {condition: email && email.length > 255, error: 'E02'},
      {condition: email && !validation.isValidEmail(email), error: 'E06'}
    ];
    for (const {condition, error} of validations) {
      if (condition) errors.push(i18n.__(`msg.${error}`));
    }
    if (errors.length > 0) return res.status(400).json({ errors: errors });


    const user = await User.findOne({
      where: { email },
      attributes: ['id', 'password', 'is_blocked']
    });
    if (!user)
      return res.status(404).json({errors: [i18n.__('msg.E12')]});

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.status(401).json({errors: [i18n.__('msg.E12')]});

    if (user.is_blocked)
      return res.status(403).json({errors: [i18n.__('msg.E13')]});

    const jwtPayload = { userId: user.id };
    const token = jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: '1h'});
    res.cookie('jwt', token, {
      secure: process.env.COOKIES_SECURE === 'yes' ? true : false,
      httpOnly: true,
      sameSite: 'Strict',
      maxAge: 3600000
    });
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ errors: [i18n.__('msg.E16')] });
  }
}


/**
 * LIE_05
 * Validates the information entered and creates a new user in
 * database if validation is successful.
 */
const register = async (req, res) => {
  try {
    let { name, email, phone, password, password_confirm } = req.body;

    name = name.trim();
    email = email.trim();
    phone = phone.trim();
    password = password.trim();
    password_confirm = password_confirm.trim();

    const errors = [];
    const validations = [
      {condition: !name || !email || !phone || !password || !password_confirm, error: 'E01'},
      {condition: email && email.length > 255, error: 'E02'},
      {condition: name && name.length > 255, error: 'E03'},
      {condition: phone && phone.length > 32, error: 'E05'},
      {condition: email && !validation.isValidEmail(email), error: 'E06'},
      {condition: phone && !validation.isValidPhone(phone), error: 'E07'},
      {condition: password && password.length < 8, error: 'E08'},
      {condition: password && password !== password_confirm, error: 'E09'}
    ];
    for (const {condition, error} of validations) {
      if (condition) errors.push(i18n.__(`msg.${error}`));
    }
    if (errors.length > 0) return res.status(400).json({ errors: errors });

    // Finding a user, since two users with same e-mail address is not allowed.
    const foundUser = await User.findOne({
      where: { email },
      attributes: ['id']
    });
    if (foundUser)
      return res.status(409).json({ errors: [i18n.__('msg.E11')] });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name: name,
      email: email,
      password: hashedPassword,
      phone: phone
    });
    const newTaskList = await TaskList.create({ owner_user: newUser.id });
    
    res.status(201).json({message: i18n.__('msg.S01')});
  } catch (error) {
    console.error(error);
    res.status(500).json({ errors: [i18n.__('msg.E16')] });
  }
}


/**
 * LIE_06
 * Logs the user out of the system.
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
      {condition: !id || !name || !phone, error: 'E01'},
      {condition: name && name.length > 255, error: 'E03'},
      {condition: phone && phone.length > 32, error: 'E05'},
      {condition: phone && !validation.isValidPhone(phone), error: 'E07'},
      {condition: new_password && new_password.length > 0 && new_password.length < 8, error: 'E08'},
      {condition: new_password && new_password.length > 0 && new_password !== password_confirm, error: 'E09'}
    ];
    for (const {condition, error} of validations) {
      if (condition) errors.push(i18n.__(`msg.${error}`));
    }
    if (errors.length > 0) return res.status(400).json({errors});

    const user = await User.findOne({
      where: { id }, attributes: { include: ['password'] }
    });
    if (!user)
      return res.status(404).json({ errors: [i18n.__('msg.E18')] });

    if (new_password.length > 0) {
      const checkPassword = await bcrypt.compare(current_password, user.password);
      if (!checkPassword)
        return res.status(403).json({ errors: [i18n.__('msg.E10')] });
    }

    user.name = name;
    user.phone = phone;
    if (new_password.length > 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(new_password, salt);
      user.password = hashedPassword;
    }
    await user.save();

    res.status(200).json({ success: true, message: i18n.__('msg.S02') });
  } catch (error) {
    console.error(error);
    res.status(500).json({ errors: [i18n.__('msg.E16')] });
  }
};


/**
 * LIE_08
 * Blocks the user (bans the user from accessing the system).
 */
const block = async (req, res) => {
  let { id } = req.params;
  if (!id || isNaN(id))
    return res.status(400).json({ errors: [i18n.__('msg.E20')] });

  try {
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ errors: [i18n.__('msg.E18')] });

    const action = user.is_blocked ? 'unblock' : 'block';
    user.is_blocked = !user.is_blocked;
    await user.save()

    const message = action === 'block' ? i18n.__('msg.S03') : i18n.__('msg.S04')

    res.status(200).json({ success: true, message: message });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ errors: [i18n.__('msg.E16')] });
  }
};


/**
 * LIE_09
 * Deletes the user from the system together with its related data.
 */
const deleteUser = async (req, res) => {
  let { id } = req.params;
  if (!id || isNaN(id))
    return res.status(400).json({ errors: [i18n.__('msg.E20')] });
  
  const t = await sequelize.transaction();
  try {
    const user = await User.findByPk(id);
    if (!user)
      return res.status(404).json({ errors: [i18n.__('msg.E18')] });
    
    await user.destroy({ transaction: t });
    await t.commit();

    res.status(200).json({message: i18n.__('msg.S05')});
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ errors: [i18n.__('msg.E16')] });
  }
};

module.exports = {
  getAllUsers, getTeamUsers, getCompanyUsers, 
  login, register, logout, changeData, block, deleteUser
};