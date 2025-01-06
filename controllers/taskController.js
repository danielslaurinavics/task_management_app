const i18n = require('i18n');

const { User } = require('../models/User');
const { TaskList } = require('../models/TaskList');
const { Task, TaskPersons } = require('../models/Task');

const sequelize = require('../config/database');
const validation = require('../utils/validation');



/**
 * UZD_01
 * Returns an array of all tasks belonging to the task list of the
 * user to who the list belongs.
 * @param {Object} req - Request object containing the ID of the user whose
 * task list tasks should be searched
 * @param {Object} res - Response object for sending the result to the client.
 */
const getUserListTasks = async (req, res) => {
  const { id: user_id } = req.params;
  if (!user_id || isNaN(user_id))
    return res.status(400).json({errors: [i18n.__('msg.E20')]});

  try {
    const list = await TaskList.findOne({ where: { owner_user: user_id }});
    if (!list)
      return res.status(404).json({errors: [i18n.__('msg.E18')]});

    const data = await Task.findAll({ 
      where: { list_id: list.id },
      order: [['priority', 'DESC']]
    });
    const tasks = [];
    data.forEach(task => {
      const getPriorityKey = (priority) => {
        if (priority === 0) return 'low';
        if (priority === 1) return 'medium';
        if (priority === 2) return 'high';
      }
      const priorityKey = getPriorityKey(task.priority);
      tasks.push({
        id: task.id, name: task.name, description: task.description,
        status: task.status, priority: task.priority, 
        priority_word: i18n.__(`tasks.priorities.${priorityKey}`),
        due_date: task.due_date,
        allowed_to: {
          change_word: i18n.__('ui.tasks.change'),
          status_word: i18n.__('ui.tasks.status'),
          delete_word: i18n.__('ui.tasks.delete'),
          delete_confirm: i18n.__('msg.C13'),
        }
      });
    });

    res.status(200).json({tasks});
  } catch (error) {
    console.error(error);
    return res.status(500).json({ errors: [i18n.__('msg.E16')] });
  }
}



/**
 * UZD_02
 * Returns an array of all tasks belonging to the team list
 * of team whose ID is provided
 * @param {Object} req - Request object containing the ID of the team whose
 * task list tasks should be searched
 * @param {Object} res - Response object for sending the result to the client.
 */
const getTeamListTasks = async (req, res) => {
  const { id: team_id } = req.params;
  if (!team_id || isNaN(team_id))
    return res.status(400).json({errors: [i18n.__('msg.E20')]});
  
  try {
    const list = await TaskList.findOne({ where: {
      is_team_list: true, owner_team: team_id
    }});
    if (!list)
      return res.status(404).json({errors: [i18n.__('msg.E18')]});

    const data = await Task.findAll({
      where: { list_id: list.id },
      order: [['priority', 'DESC']],
      include: [
        {
          model: User, attributes: ['id', 'name'],
          through: { attributes: [] }, required: false,
        }
      ]
    });
    const tasks = [];
    data.forEach(task => {
      const getPriorityKey = (priority) => {
        if (priority === 0) return 'low';
        if (priority === 1) return 'medium';
        if (priority === 2) return 'high';
      }
      const priorityKey = getPriorityKey(task.priority);
      tasks.push({
        id: task.id, name: task.name, description: task.description,
        status: task.status, priority: task.priority, 
        priority_word: i18n.__(`tasks.priorities.${priorityKey}`),
        due_date: task.due_date,
        allowed_to: {
          change_word: i18n.__('ui.tasks.change'),
          status_word: i18n.__('ui.tasks.status'),
          delete_word: i18n.__('ui.tasks.delete'),
          delete_confirm: i18n.__('msg.C13'),
          add_prompt: i18n.__('ui.tasks.add_person')
        },
        assigned_users: task.Users || []
      });
    });

    res.status(200).json({tasks});
  } catch (error) {
    console.error(error);
    return res.status(500).json({ errors: [i18n.__('msg.E16')] });
  }
}



/**
 * UZD_03
 * Returns an object containing information about a specific task.
 * @param {Object} req - Request object containing the ID of the task to fetch
 * @param {Object} res - Response object for sending the result to the client.
 * @returns 
 */
const getTaskData = async (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(id))
    return res.status(400).json({errors: [i18n.__('msg.E20')]});
  
  try {
    const task = await Task.findByPk(id);
    if (!task)
      return res.status(404).json({errors: [i18n.__('msg.E18')]});

    return res.status(200).json({task});
  } catch (error) {
    console.error(error);
    res.status(500).json({ errors: [i18n.__('msg.E16')] });
  }
}



/**
 * UZD_04
 * Creates a new task.
 * If the task is a personal task, it also automatically designates the task list's
 * owner as the person responsible for the task.
 * @param {Object} req - Request object containing new team's information.
 * @param {Object} res - Response object for sending the result to the client.
 */
const createTask = async (req, res) => {
  const { id } = req.params;
  const { type, list_id } = req.body;
  try {
    if (!id || isNaN(id) || !list_id || isNaN(list_id))
      return res.status(400).json({errors: [i18n.__('msg.E20')]});

    if(!type || !['user','team'].includes(type))
      return res.status(400).json({errors: [i18n.__('msg.E20')]});

    const list = await TaskList.findOne({ where: { id: list_id }});
    if (!list)
      return res.status(404).json({errors: [i18n.__('msg.E18')]});

    const newTask = await Task.create({
      name: i18n.__('ui.task.untitled'),
      list_id: list.id
    });

    if (type === 'user') {
      const personalTaskRelation = await TaskPersons.create({
        task_id: newTask.id,
        user_id: id
      });
    }

    res.status(200).json({message: i18n.__('msg.S11')});
  } catch (error) {
    console.log(error);
    res.status(500).json({errors: [i18n.__('msg.E16')]});
  }
};



/**
 * UZD_05
 * Changes the task's completion status
 * @param {Object} req - Request object containing the new status.
 * @param {Object} res - Response object for sending the result to the client.
 */
const changeTaskStatus = async (req, res) => {
  let { task_id: id } = req.body;

  if (!id || isNaN(id))
    return res.status(400).json({errors: [i18n.__('msg.E20')]});

  try {
    const task = await Task.findByPk(id);
    if (!task)
      return res.status(404).json({errors: [i18n.__('msg.E18')]});

    if (task.status < 3) {
      task.status += 1;
    } else task.status = 3;
    await task.save();

    res.status(200).json({ success: true, message: i18n.__('msg.S15')});
  } catch (error) {
    console.error(error);
    res.status(500).json({ errors: [i18n.__('msg.E16')] });
  }
};



/**
 * UZD_06
 * Update task's data.
 * @param {Object} req - Request object containing updated task data.
 * @param {Object} res - Response object for sending the result to the client.
 */
const changeTaskData = async (req, res) => {
  let { task_id, name, description, priority, due_date } = req.body;

  try {
    name = name?.trim();
    description = description ?description.trim() : null;
    priority = priority ? parseInt(priority, 10) : 0;
    due_date = due_date ? new Date(due_date) : null;

    const errors = [];
    const rules = [
      {condition: !name || ![0,1,2].includes(priority), error: 'E01'},
      {condition: name && name.length > 255, error: 'E04'}
    ];
    for (const { condition, error } of rules) {
      if (condition) errors.push(i18n.__(`msg.${error}`));
    }
    if (errors.length > 0) return res.status(400).json({errors});

    const task = await Task.findByPk(task_id);
    if (!task)
      return res.status(404).json({errors: [i18n.__('msg.E18')]});

    task.name = name;
    task.description = description;
    task.priority = priority;
    if (due_date) task.due_date = due_date;

    await task.save();
    res.status(200).json({ success: true, message: i18n.__('msg.S15')});
  } catch (error) {
    console.error(error);
    res.status(500).json({ errors: [i18n.__('msg.E16')] });
  }
};



/**
 * UZD_07
 * Deletes the task and its persons responsible records from the database.
 * @param {Object} req - Request object containing the ID of the task to delete.
 * @param {Object} res - Response object for sending the result to the client.
 */
const deleteTask = async (req, res) => {
  const t = await sequelize.transaction();
  let { task_id: id } = req.body;
  if (!id || isNaN(id))
    return res.status(400).json({errors: [i18n.__('msg.E20')]});
  
  try {
    const task = await Task.findByPk(id);
    if (!task)
      return res.status(404).json({errors: [i18n.__('msg.E18')]});

    await task.destroy();
    t.commit();

    res.status(200).json({ success: true, message: i18n.__('msg.S16')});
  } catch {
    await t.rollback();
    console.log(error);
    res.status(500).json({ errors: [i18n.__('msg.E16')] });
  }
};



/**
 * UZD_08
 * Assign a user to a task.
 * @param {Object} req - Request object containing the ID of the task and
 * email of the user who has to be added.
 * @param {Object} res - Response object for sending the result to the client.
 */
const addPersonResponsible = async (req, res) => {
  let { task_id, email } = req.body;
  try {
    email = email?.trim();
    const errors = [];
    const rules = [
      {condition: !task_id || isNaN(task_id) || !email, error: 'E20'},
      {condition: email && email.length > 255 || !email, error: 'E02'},
      {condition: email && !validation.isValidEmail(email), error: 'E06'}
    ];
    for (const {condition, error} of rules) {
      if (condition) errors.push(i18n.__(`msg.${error}`));
    }
    if (errors.length > 0) return res.status(400).json({ errors });

    const task = await Task.findByPk(task_id);
    const user = await User.findOne({ where: { email }});
    if (!task || !user)
      return res.status(404).json({errors: [i18n.__('msg.E18')]});

    const taskPersons = await TaskPersons.findAll({ where: { task_id } });
    if (taskPersons.find(person => person.user_id === user.id))
      return res.status(409).json({errors: [i18n.__('msg.E19')]});

    const newTaskPerson = await TaskPersons.create({
      task_id, user_id: user.id
    });

    res.status(200).json({message: i18n.__('msg.S08')});
  } catch (error) {
    console.error(error);
    res.status(500).json({ errors: [i18n.__('msg.E16')] });
  }
};



/**
 * UZD_09
 * Remove the user's assignment to a task.
 * @param {Object} req - Request object containing the IDs of the task and the user.
 * @param {Object} res - Response object for sending the result to the client.
 */
const removePersonResponsible = async (req, res) => {
  const { task_id, user_id } = req.body;
  const t = await sequelize.transaction();

  if (!task_id || !user_id || isNaN(task_id) || isNaN(user_id))
    return res.status(400).json({errors: [i18n.__('msg.E20')]});

  try {
    const taskPerson = await TaskPersons.findOne({ where: { task_id, user_id }});
    if (!taskPerson)
      return res.status(404).json({errors: [i18n.__('msg.E18')]});

    await taskPerson.destroy();
    await t.commit({transaction: t});

    res.status(200).json({message: i18n.__('msg.S09')});
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ errors: [i18n.__('msg.E16')] });
  }
};

module.exports = {
  getUserListTasks, getTeamListTasks, getTaskData, createTask, changeTaskStatus,
  changeTaskData, deleteTask, addPersonResponsible, removePersonResponsible
};