// middleware/companyAuth.js
// Middleware functions for locale management
// Created by Daniels Laurinavičs, 2025-01-05.

const i18n = require('i18n');

const { Team, TeamParticipant } = require('../models/Team');
const { TaskList } = require('../models/TaskList');


/**
 * Checks whether the user can access the specified team's resources.
 * User's data is acquired through authenticate() middleware, team ID is
 * acquired from the team page access request parameters.
 * Grants access to the team if the user is part of it (and also adds team data to it),
 * otherwise displays an error and stops granting access to the page.
 */
async function checkForAccess(req, res, next) {
  if (!req.user)
    return res.status(401).render('error', {error: i18n.__('msg.E14')});

  const user = req.user;
  const { id: teamId } = req.params;
  if (!teamId || isNaN(teamId))
    return res.status(403).render('error', {error: i18n.__('msg.E20')});

  try {
	const teamData = await Team.findByPk(teamId);
    if (!teamData)
      return res.status(404).render('error', {error: i18n.__('msg.E18')});
    
	const teamRelation = await TeamParticipant.findOne({
      where: { team_id: teamId, user_id: user.id }
    });
    if (!teamRelation)
      return res.status(403).render('error', {error: i18n.__('msg.E14')});

    const taskList = await TaskList.findOne({ where: { is_team_list: true, owner_team: teamData.id }});
    if (!taskList)
      return res.status(404).render('error', {error: i18n.__('msg.E18')});
    
    const team = {
      id: teamData.id,
      name: teamData.name,
      is_manager: teamRelation.is_manager,
      list_id: taskList.id
    } 
    req.team = team;
    next();
  } catch (error) { res.status(500).render('error', {error: i18n.__('msg.E16')}); }
}


/**
 * Checks whether the user who has access to the team is its manager.
 * If the user is not the team's manager, he's denied access.
 */
async function checkManager(req, res, next) {
  if (req.team) {
    if (req.team.is_manager) return next();
    else return res.status(403).render('error', {error: i18n.__('errors.ERR_14')});
  }
}

module.exports = { checkForAccess, checkManager };