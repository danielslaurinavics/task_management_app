const i18n = require('i18n');

const { User } = require('../models/User');
const { Team } = require('../models/Team');
const { TaskList } = require('../models/TaskList');
const { Task, TaskPersons } = require('../models/Task');


const createTaskList = async (req, res) => {
  const { userId, teamId } = req.body;

  const user_id = userId?.trim();
  const team_id = teamId?.trim();

  if (!user_id && !team_id) return res.status(400);
  else if (user_id && team_id) return res.status(400);

  try {
    if (user_id) {
      const newTaskList = await TaskList.create({
        owner_user: user_id
      });
    } else if (team_id) {
      const newTaskList = await TaskList.create({
        is_team_list: true,
        owner_team: team_id
      });
    }
    res.return(201).json({ message: 'New task list created' });
  } catch (error) {
    console.log(error);
    return res.status(500)
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
