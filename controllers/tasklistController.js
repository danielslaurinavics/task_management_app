const i18n = require('i18n');

const { User } = require('../models/User');
const { Team } = require('../models/Team');
const { TaskList } = require('../models/TaskList');
const { Task, TaskPersons } = require('../models/Task');


const createTaskList = async (req, res) => {
  try {
    let { type, ownerId } = req.body;

    type = type.trim();
    ownerId = ownerId.trim();

    if (!type || !ownerId) return res.status(400);
    else if (type !== 'user' && type !== 'team') return res.status(400);

    let taskList;
    if (type === 'user') {
      taskList = await TaskList.create({
        owner_user: ownerId
      });
    } else if (type === 'team') {
      taskList = await TaskList.create({
        is_team_list: true,
        owner_team: ownerId
      });
    }
    if (taskList) return res.status(201).json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: [i18n.__('errors.ERR_18')] });
  }
};

const deleteTaskList = async (req, res) => {
  const { userId, teamId } = req.body;

  const user_id = userId?.trim();
  const team_id = teamId?.trim();

  if (!user_id && !team_id) return res.status(400);
  else if (user_id && team_id) return res.status(400);

  try {
    let taskList;
    if (user_id) {
      taskList = await TaskList.findOne({
        where: { owner_user: user_id }
      });
      if (!taskList) return res.status(404);
    } else if (team_id) {
      taskList = await TaskList.findOne({
        where: { owner_team: team_id }
      });
      if (!taskList) return res.status(404);
    }
    taskList.destroy();
  } catch (error) {
    console.log(error);
    return res.status(500);
  }
};

module.exports = {
  createTaskList, deleteTaskList
};
