const i18n = require('i18n');

const { User } = require('../models/User');
const { Company } = require('../models/Company');
const { TaskList } = require('../models/TaskList');
const { Team, TeamParticipant } = require('../models/Team');



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

const changeTeamData = async (req, res) => {

};

const addToTeam = async (req, res) => {

};

const removeFromTeam = async (req, res) => {

};

const elevateToManager = async (req, res) => {

};

const lowerToParticipant = async (req, res) => {

};

const deleteTeam = async (req, res) => {

};

module.exports = {
  createTeam, changeTeamData, addToTeam, removeFromTeam,
  elevateToManager, lowerToParticipant, deleteTeam
};