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
    return res.status(400).json({errors: [i18n.__('errors.ERR_01')]});

  try {
    const list = await TaskList.findOne({ where: { owner_user: user_id }});
    if (!list)
      return res.status(404).json({errors: [i18n.__('errors.ERR_19')]});

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
          delete_confirm: i18n.__('confirm.CON_13'),
        }
      });
    });

    res.status(200).json({tasks});
  } catch (error) {
    console.error(error);
    return res.status(500).json({ errors: [i18n.__('errors.ERR_18')] });
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
    return res.status(400).json({errors: [i18n.__('errors.ERR_01')]});
  
  try {
    const list = await TaskList.findOne({ where: {
      is_team_list: true, owner_team: team_id
    }});
    if (!list)
      return res.status(404).json({errors: [i18n.__('errors.ERR_19')]});

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
          delete_confirm: i18n.__('confirm.CON_13'),
          add_prompt: i18n.__('ui.tasks.add_person')
        },
        assigned_users: task.Users || []
      });
    });

    res.status(200).json({tasks});
  } catch (error) {
    console.error(error);
    return res.status(500).json({ errors: [i18n.__('errors.ERR_18')] });
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
    return res.status(400).json({errors: [i18n.__('errors.ERR_01')]});
  
  try {
    const task = await Task.findByPk(id);
    if (!task)
      return res.status(404).json({errors: [i18n.__('errors.ERR_19')]});

    return res.status(200).json({task});
  } catch (error) {
    console.error(error);
    res.status(500).json({ errors: [i18n.__('errors.ERR_18')] });
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
      return res.status(400).json({errors: [i18n.__('errors.ERR_01')]});

    if(!type || !['user','team'].includes(type))
      return res.status(400).json({errors: [i18n.__('errors.ERR_01')]});

    const list = await TaskList.findOne({ where: { id: list_id }});
    if (!list)
      return res.status(404).json({errors: [i18n.__('errors.ERR_19')]});

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

    res.status(200).json({message: i18n.__('success.SUC_16')});
  } catch (error) {
    console.log(error);
    res.status(500).json({errors: [i18n.__('errors.ERR_18')]});
  }
};



/**
 * UZD_05
 * Changes the task's completion status
 * @param {Object} req - Request object containing the new status.
 * @param {Object} res - Response object for sending the result to the client.
 */
const changeTaskStatus = async (req, res) => {
  try {
    // Gets the task id from request parameters and the task's
    // new status from request body.
    let { task_id: id } = req.body;

    // Sanitizes status input and does entry value validation.
    if (!id || isNaN(id))
      return res.status(400).json({errors: [i18n.__('errors.ERR_01')]});

    // Checks the status against accepted statuses.
    // If the status input does not correspond to one of the accepted ones,
    // it will default to UPCOMING

    // Finds the task by its ID and returns an error if the task is not found.
    const task = await Task.findByPk(id);
    if (!task)
      return res.status(404).json({errors: [i18n.__('errors.ERR_19')]});

    // Changing the task's completion status and saving changes
    // to the database.
    if (task.status < 3) {
      task.status += 1;
    } else task.status = 3;
    await task.save();

    // Sending the successful task edit message
    res.status(200).json({ success: true, message: i18n.__('success.SUC_17')});
  } catch (error) {
    // Outputting error to the console and sending a
    // generic internal server error message.
    console.error(error);
    res.status(500).json({ errors: [i18n.__('errors.ERR_18')] });
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
      {condition: !name || ![0,1,2].includes(priority), error: 'ERR_01'},
      {condition: name && name.length > 255, error: 'ERR_04'}
    ];
    for (const { condition, error } of rules) {
      if (condition) errors.push(i18n.__(`errors.${error}`));
    }
    if (errors.length > 0) return res.status(400).json({errors});

    const task = await Task.findByPk(task_id);
    if (!task)
      return res.status(404).json({errors: [i18n.__('errors.ERR_19')]});

    task.name = name;
    task.description = description;
    task.priority = priority;
    if (due_date) task.due_date = due_date;

    await task.save();
    res.status(200).json({ success: true, message: i18n.__('success.SUC_17')});
  } catch (error) {
    console.error(error);
    res.status(500).json({ errors: [i18n.__('errors.ERR_18')] });
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
  try {
    // Gets the deletable task id from request parameters and validates it.
    let { task_id: id } = req.body;
    if (!id || isNaN(id))
      return res.status(400).json({errors: [i18n.__('errors.ERR_01')]});

    // Finds the task with that ID and returns an error if it doesn't
    const task = await Task.findByPk(id);
    if (!task)
      return res.status(404).json({errors: [i18n.__('errors.ERR_19')]});

    // Deletes the task and commits changes to the database.
    await task.destroy();
    t.commit();

    // Sending the successful deletion message
    res.status(200).json({ success: true, message: i18n.__('success.SUC_18')});
  } catch {
    // Rolling back the deletion action, outputting the errors to the
    // console and sending a generic internal server error message.
    await t.rollback();
    console.log(error);
    res.status(500).json({ errors: [i18n.__('errors.ERR_18')] });
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
      {condition: !task_id || isNaN(task_id) || !email, error: 'ERR_01'},
      {condition: email && email.length > 255 || !email, error: 'ERR_02'},
      {condition: email && !validation.isValidEmail(email) || !email, error: 'ERR_06'}
    ];
    for (const {condition, error} of rules) {
      if (condition) errors.push(i18n.__(`errors.${error}`));
    }
    if (errors.length > 0) return res.status(400).json({ errors });

    const task = await Task.findByPk(task_id);
    const user = await User.findOne({ where: { email }});
    if (!task || !user)
      return res.status(404).json({errors: [i18n.__('errors.ERR_19')]});

    const taskPersons = await TaskPersons.findAll({ where: { task_id } });
    if (taskPersons.find(person => person.user_id === user.id))
      return res.status(409).json({errors: [i18n.__('errors.ERR_20')]});

    const newTaskPerson = await TaskPersons.create({
      task_id, user_id: user.id
    });

    res.status(200).json({message: i18n.__('success.SUC_09')});
  } catch (error) {
    console.error(error);
    res.status(500).json({ errors: [i18n.__('errors.ERR_18')] });
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
  try {
    if (!task_id || !user_id || isNaN(task_id) || isNaN(user_id))
      return res.status(400).json({errors: [i18n.__('errors.ERR_01')]});

    const taskPerson = await TaskPersons.findOne({ where: { task_id, user_id }});
    if (!taskPerson)
      return res.status(404).json({errors: [i18n.__('errors.ERR_19')]});

    await taskPerson.destroy();
    await t.commit({transaction: t});

    res.status(200).json({message: i18n.__('success.SUC_10')});
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ errors: [i18n.__('errors.ERR_18')] });
  }
};

module.exports = {
  getUserListTasks, getTeamListTasks, getTaskData, createTask, changeTaskStatus,
  changeTaskData, deleteTask, addPersonResponsible, removePersonResponsible
};