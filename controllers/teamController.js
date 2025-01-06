const i18n = require('i18n');

const { User } = require('../models/User');
const { Company } = require('../models/Company');
const { TaskList } = require('../models/TaskList');
const { Team, TeamParticipant } = require('../models/Team');

// Importing validation utility functions.
const validation = require('../utils/validation');
const sequelize = require('../config/database');



/**
 * KOM_01
 * Returns an array of all teams owned by the company
 * @param {Object} req - Request object containing the ID of the company whose
 * tasks have to be searched
 * @param {Object} res - Response object for sending the result to the client.
 */
const getAllCompanyTeams = async (req, res) => {
  let { id: companyId } = req.params;
  try {
    if (!companyId || isNaN(companyId))
      return res.status(400).json({ errors: [i18n.__('errors.ERR_01')] });

    const company = await Company.findByPk(companyId);
    if (!company)
      return res.status(404).json({ errors: [i18n.__('errors.ERR_19')] });

    const data = await Team.findAll({
      where: { owner_company: company.id },
      order: [['id', 'ASC']]
    });

    const teams = [];
    data.forEach(team => {
      teams.push({
        id: team.id, name: team.name, description: team.description,
        allowed_to: {
          add_word: i18n.__('ui.dashboard.team.add_to_team'),
          add_prompt: i18n.__('ui.dashboard.team.add_to_team_prompt'),
          add_confirm: i18n.__('confirm.CON_09', { user: '%user' }),
          delete_word: i18n.__('ui.dashboard.team.delete_team'),
          delete_confirm: i18n.__('confirm.CON_08', { name: team.name, company: company.name })
        }
      })
    });

    res.status(200).json({ teams });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ errors: [i18n.__('errors.ERR_18')] });
  }
}



/**
 * KOM_02
 * Creates a new team
 * @param {Object} req - Request object containing new team's information.
 * @param {Object} res - Response object for sending the result to the client.
 */
const createTeam = async (req, res) => {
  const errors = [];
  try {
    // Getting creation form field values.
    let { name, description } = req.body;
    let { id: companyId } = req.params;

    // Sanitizing the input by removing front and rear whitespaces,
    // and converting ids to integers.
    name = name.trim();
    description = description.trim();

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
    const newTeam = await Team.create({ name, description, owner_company: company.id });
    
    // Creating a new task list, since a team always have one.
    const newTaskList = await TaskList.create({
      is_team_list: true,
      owner_team: newTeam.id
    });

    res.status(201).json({ success: true, message: i18n.__('success.SUC_12')});
  } catch (error) {
    console.error(error);
    errors.push(i18n.__('errors.ERR_18'));
    res.status(500).json({ errors: errors });
  }
};



/**
 * KOM_03
 * Deletes the team and all of its related data from the database.
 * @param {Object} req - Request object containing the ID of the team to be deleted.
 * @param {Object} res - Response object for sending the result to the client.
 */
const deleteTeam = async (req, res) => {
  const { team_id } = req.body;
  const t = await sequelize.transaction();
  try {
    if (!team_id || isNaN(team_id))
      return res.status(400).json({errors: [i18n.__('errors.ERR_01')]});

    // Finds the team with that ID and returns an error if it doesn't
    const team = await Team.findByPk(team_id);
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



/**
 * KOM_04
 * Adds a new team participant user to the team.
 * @param {Object} req - Request object containing the team ID and the e-mail of the user
 * who has to be added to the team.
 * @param {Object} res - Response object for sending the result to the client.
 */
const addToTeam = async (req, res) => {
  let { id: team_id } = req.params;
  let { email } = req.body;

  try {
    const errors = [];
    const rules = [
      {condition: !team_id || isNaN(team_id) || !email, error: 'ERR_01'},
      {condition: email && email.length > 255 || !email, error: 'ERR_02'},
      {condition: email && !validation.isValidEmail(email) || !email, error: 'ERR_06'}
    ];
    for (const {condition, error} of rules) {
      if (condition) errors.push(i18n.__(`errors.${error}`));
    }
    if (errors.length > 0) return res.status(400).json({ errors });

    const team = await Team.findByPk(team_id);
    const user = await User.findOne({ where: { email }});
    if (!team || !user)
      return res.status(404).json({ errors: [i18n.__('errors.ERR_19')] });

    const participantList = await TeamParticipant.findAll({ where: { team_id } });
    if (participantList.find(member => member.user_id === user.id))
      return res.status(409).json({ errors: [i18n.__('errors.ERR_20')] });

    const areManagers = await TeamParticipant.findAll({ where: { team_id, is_manager: true }});
    
    const newParticipant = await TeamParticipant.create({
     team_id,
     user_id: user.id,
     is_manager: areManagers.length > 0 ? false : true
    });

    res.status(200).json({message: i18n.__('success.SUC_09')});
  } catch (error) {
    console.error(error);
    res.status(500).json({ errors: [i18n.__('errors.ERR_18')] });
  }
};



/**
 * KOM_05
 * Removes the team participant user from the team.
 * @param {Object} req - Request object containing the team ID and the user ID of the user
 * who has to be removed from the team.
 * @param {Object} res - Response object for sending the result to the client.
 */
const removeFromTeam = async (req, res) => {
  let { id: team_id } = req.params;
  let { user_id } = req.body;
  const t = await sequelize.transaction();

  try {
    if (!team_id || isNaN(team_id) || !user_id && isNaN(user_id))
      return res.status(400).json({ errors: [i18n.__('errors.ERR_01')] });

    const teamRelation = await TeamParticipant.findOne({
      where: { team_id, user_id }
    });
    if (!teamRelation)
      return res.status(404).json({ errors: [i18n.__('errors.ERR_19')] });

    await teamRelation.destroy();
    await t.commit();
    res.status(200).json({ message: i18n.__('success.SUC_10')} );
  } catch (error) {
    await t.rollback();
    console.log(error);
    res.status(500).json({ errors: [i18n.__('errors.ERR_18')] });
  }
};



/**
 * KOM_06
 * Changes the role of the user.
 * If the user is a member - the user gets elevated to team manager
 * Otherwise, the user gets lowered to team member
 * @param {*} req - Response object containing team and user information
 * @param {*} res - Response object for sending the result to the client.
 */
const changeRole = async (req, res) => {
  const { id: team_id } = req.params;
  const { user_id } = req.body;
  try {
    if (!team_id || !user_id || isNaN(team_id) || isNaN(user_id))
      return res.status(400).json({errors: [i18n.__('errors.ERR_01')]});

    const teamRelation = await TeamParticipant.findOne({ where: { team_id, user_id }});
    if (!teamRelation)
      return res.status(404).json({errors: [i18n.__('errors.ERR_19')]});

    teamRelation.is_manager = !teamRelation.is_manager;
    await teamRelation.save();

    return res.status(200).json({message: i18n.__('success.SUC_14')});
  } catch (error) {
    console.error(error);
    res.status(500).json({ errors: [i18n.__('errors.ERR_18')] });
  }
}



/**
 * Get all the teams where the user is part of
 * @param {Object} req - Request object containing id of the user whose
 * team participation has to be searched.
 * @param {Object} res - Response object for sending the result to the client.
 * @returns 
 */
const getUserTeams = async (req, res) => {
  const  {id: user_id} = req.params;
  try {
    if (!user_id || isNaN(user_id))
      return res.status(400).json({ errors: [i18n.__('errors.ERR_01')] });

    const user = await User.findByPk(user_id);
    if (!user)
      return res.status(404).json({ errors: [i18n.__('errors.ERR_19')] });

    const teams = await Team.findAll({
      include: [
        {
          model: User,
          attributes: [],
          through: {
            attributes: ['is_manager']
          },
          where: { id: user_id },
          required: true
        }
      ]
    });

    res.status(200).json({teams});
  } catch (error) {
    console.error(error);
    return res.status(500).json({ errors: [i18n.__('errors.ERR_18')] });
  }
}

module.exports = {
  getAllCompanyTeams, createTeam, deleteTeam, addToTeam, 
  removeFromTeam, changeRole, getUserTeams, 
};