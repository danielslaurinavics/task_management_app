const i18n = require('i18n');

const { Team, TeamParticipant } = require('../models/Team');
const { TaskList } = require('../models/TaskList');

async function checkForAccess(req, res, next) {
  if (!req.user)
    return res.status(401).render('error', {error: i18n.__('errors.ERR_14')});

  const user = req.user;
  const { id: teamId } = req.params;
  if (!teamId || isNaN(teamId))
    return res.status(403).render('error', {error: i18n.__('errors.ERR_01')});

  try {
    const teamRelation = await TeamParticipant.findOne({
      where: { team_id: teamId, user_id: user.id }
    });
    if (!teamRelation)
      return res.status(403).render('error', {error: i18n.__('errors.ERR_14')});

    const teamData = await Team.findByPk(teamId);
    if (!teamData)
      return res.status(404).render('error', {error: i18n.__('errors.ERR_16')});

    const taskList = await TaskList.findOne({ where: { is_team_list: true, owner_team: teamData.id }});
    if (!taskList)
      return res.status(404).render('error', {error: i18n.__('errors.ERR_16')});
    
    const team = {
      id: teamData.id,
      name: teamData.name,
      description: teamData.description,
      is_manager: teamRelation.is_manager,
      list_id: taskList.id
    } 
    req.team = team;
    next();
  } catch (error) {
    console.error(error);
    res.status(500).render('error', {error: i18n.__('errors.ERR_18')});
  }
}



async function checkManager(req, res, next) {
  if (req.team) {
    if (req.team.is_manager) return next();
    else return res.status(403).render('error', {error: i18n.__('errors.ERR_14')});
  }
}

module.exports = { checkForAccess, checkManager };