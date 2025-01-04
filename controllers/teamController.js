// Importing thrid-party libraries and middleware.
const i18n = require('i18n');

// Importing necessary models.
const { User } = require('../models/User');
const { Company } = require('../models/Company');
const { TaskList } = require('../models/TaskList');
const { Team, TeamParticipant } = require('../models/Team');

// Importing validation utility functions.
const validation = require('../utils/validation');

// Importing database connection module.
const sequelize = require('../config/database');


/**
 * Creates a new team
 * @param {Object} req - Request object containing new team's information.
 * @param {Object} res - Response object for sending the result to the client.
 */
const createTeam = async (req, res) => {
  const errors = [];
  try {
    // Getting creation form field values.
    let { name, companyId } = req.body;

    // Sanitizing the input by removing front and rear whitespaces,
    // and converting ids to integers.
    name = name.trim();
    companyId = parseInt(companyId.trim(), 10);

    // Validation of entered values.
    const validations = [
      {condition: !name || !companyId || isNaN(companyId), error: 'ERR_01'},
      {condition: name && name.length > 255, error: 'ERR_04'},
    ];
    for (const {condition, error} of validations) {
      if (condition) errors.push(i18n.__(`errors.${error}`));
    }
    if (errors.length > 0) return res.status(400).json({ errors });

    // Checking whether a company with such id exists in the database.
    // Returns an error if no such company was found.
    const company = await Company.findByPk(companyId);
    if (!company)
      return res.status(404).json({ errors: [i18n.__('errors.ERR_19')] });
    
    // Creating a new team entry in the database
    const newTeam = await Team.create({ name, owner_company: company.id });
    
    // Creating a new task list, since team always have one.
    const newTaskList = await TaskList.create({
      is_task_list: true,
      owner_team: newTeam.id
    });

    res.status(201).json({ success: true, message: i18n.__('success.SUC_12')});
  } catch (error) {
    // Outputting the errors to the console and sending a
    // generic internal server error message.
    console.error(error);
    errors.push(i18n.__('errors.ERR_18'));
    res.status(500).json({ errors: errors });
  }
};



/**
 * Updates team's data.
 * @param {Object} req - Request object containing updated team's data.
 * @param {Object} res - Response object for sending the result to the client.
 */
const changeTeamData = async (req, res) => {

};



/**
 * Adds a new team participant user to the team.
 * @param {Object} req - Request object containing the team ID and the e-mail of the user
 * who has to be added to the team.
 * @param {Object} res - Response object for sending the result to the client.
 */
const addToTeam = async (req, res) => {

};



/**
 * Removes the team participant user from the team.
 * @param {Object} req - Request object containing the team ID and the user ID of the user
 * who has to be removed from the team.
 * @param {Object} res - Response object for sending the result to the client.
 */
const removeFromTeam = async (req, res) => {

};



/**
 * Changes the role of the user in a team to manager.
 * @param {Object} req - Request object containing the team ID and the user ID of the user
 * whose status has to be elevated
 * @param {Object} res - Response object for sending the result to the client.
 */
const elevateToManager = async (req, res) => {

};



/**
 * Changes the role of the user in a team to participant.
 * @param {Object} req - Request object containing the team ID and the user ID of the user
 * whose status has to be lowered
 * @param {Object} res - Response object for sending the result to the client.
 */
const lowerToParticipant = async (req, res) => {

};



/**
 * Deletes the team and all of its related data from the database.
 * @param {Object} req - Request object containing the ID of the team to be deleted.
 * @param {Object} res - Response object for sending the result to the client.
 */
const deleteTeam = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    // Gets the deletable team id from request parameters and validates it.
    const { id } = req.params;
    if (!id || isNaN(id))
      return res.status(400).json({errors: [i18n.__('errors.ERR_01')]});

    // Finds the team with that ID and returns an error if it doesn't
    const team = await Team.findByPk(id);
    if (!team)
      return res.status(404).json({errors: [i18n.__('errors.ERR_19')]});

    // Deletes the team and its related data from the database.
    await team.destroy();
    t.commit();

    // Sending the successful deletion message
    res.status(200).json({ success: true, message: i18n.__('success.SUC_18')});
  } catch (error) {
    // Rolling back the deletion action, outputting the error to the
    // console and sending a generic internal server error message.
    await t.rollback();
    console.log(error);
    return res.status(500).json({ errors: [i18n.__('errors.ERR_18')] });
  }
};

module.exports = {
  createTeam, changeTeamData, addToTeam, removeFromTeam,
  elevateToManager, lowerToParticipant, deleteTeam
};