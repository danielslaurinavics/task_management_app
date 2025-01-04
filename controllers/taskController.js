// Importing thrid-party libraries and middleware.
const i18n = require('i18n');

// Importing necessary models.
const { User } = require('../models/User');
const { TaskList } = require('../models/TaskList');
const { Task, TaskPersons } = require('../models/Task');

// Importing database connection module.
const sequelize = require('../config/database');



/**
 * Gets all tasks which are in user's responsibility
 * @param {Object} req - Request object containing user ID.
 * @param {Object} res - Response object for sending the result to the client.
 */
const getUserTasks = async (req, res) => {
  const errors = [];
  try {
    // Getting the user id from request parameters, and then
    // validating the input of the user ID.
    let { user_id } = req.params;
    if (!user_id || isNaN(user_id))
      return res.status(400).json({errors: [i18n.__('errors.ERR_01')]});

    // Finds a user with such ID. Returns an error if no such user
    // was found in the database.
    const user = await User.findByPk(user_id);
    if (!user)
      return res.status(404).json({errors: [i18n.__('errors.ERR_19')]});
    
    // Search the tasks in which the user is involved.
    const tasksFound = await Task.findAll({
      include: [
        {
          model: User,
          attributes: [],
          through: {
            attributes: []
          },
          where: { id: user.id },
          required: true
        }
      ]
    });

    // Write information about tasks in new array.
    const tasks = [];
    tasksFound.forEach (task => {
      tasks.push({
        name: task.name,
        description: task.description,
        status: i18n.__(`tasks.statuses.${task.status.toLowerCase()}`),
        priority: i18n.__(`tasks.priorities.${task.priority.toLowerCase()}`),
        due_date: task.due_date
      });
    });

    // Sending the tasks array.
    return res.status(200).json({ tasks })
  } catch (error) {
    console.error(error);
    errors.push(i18n.__('errors.ERR_18'));
    return res.status(500).json({ errors });
  }
}



/**
 * Creates a new task.
 * If the task is a personal task, it also automatically designates the task list's
 * owner as the person responsible for the task.
 * @param {Object} req - Request object containing new team's information.
 * @param {Object} res - Response object for sending the result to the client.
 */
const createTask = async (req, res) => {
  const errors = [];
  try {
    // Getting task creation form field values.
    let { name, description, priority, dueDate, listId } = req.body;

    // Sanitizing input by removing preceding and trailing whitespaces and
    // changing format of various variables.
    name = name.trim();
    description = description.trim();
    priority = priority.trim();
    dueDate = dueDate.trim();
    listId = parseInt(listId.trim(), 10);

    // Validation of entered values
    const validations = [
      {condition: !name || !listId, error: 'ERR_01'},
      {condition: name && name.length > 255, error: 'ERR_04'}
    ];
    for (const { condition, error } of validations) {
      if (condition) errors.push(i18n.__(`errors.${error}`));
    };

    // Searching the list for the task to be inserted to.
    // Returns an error if the list is not found.
    const listFound = await TaskList.findOne({
      where: { id: listId }
    });
    if (!listFound) return res.status(404);

    // Creates a new task entry to the database
    const newTask = await Task.create({
      name,
      description: description || null,
      priority: priority || 'LOW',
      dueDate: dueDate ? new Date(dueDate) : null,
      list_id: listId
    });

    // If the task list's owner is a user, the user is automatically
    // assigned to the user, since it is the user's personal task list.
    if (listFound.owner_user) {
      const newTaskPerson = await TaskPersons.create({
        task_id: newTask.id,
        user_id: listFound.owner_user
      });
    }

    // Sending the successful creation message.
    res.status(201).json({ success: true, message: i18n.__('success.SUC_16') });
  } catch (error) {
    // Outputting the errors to the console and sending a
    // generic internal server error message.
    console.error(error);
    errors.push(i18n.__('errors.ERR_18'));
    res.status(500).json({ errors });
  }
};



/**
 * Update task's data.
 * @param {Object} req - Request object containing updated task data.
 * @param {Object} res - Response object for sending the result to the client.
 */
const changeTaskData = async (req, res) => {

};



/**
 * Changes the task's completion status
 * @param {Object} req - Request object containing the new status.
 * @param {Object} res - Response object for sending the result to the client.
 */
const changeTaskStatus = async (req, res) => {
  try {
    // Gets the task id from request parameters and the task's
    // new status from request body.
    let { id } = req.params;
    let { status } = req.body;

    // Sanitizes status input and does entry value validation.
    status = status.trim();
    if (!id || isNaN(id) || !status)
      return res.status(400).json({errors: [i18n.__('errors.ERR_01')]});

    // Checks the status against accepted statuses.
    // If the status input does not correspond to one of the accepted ones,
    // it will default to UPCOMING.
    const statuses = ['UPCOMING', 'STARTED', 'ONGOING', 'COMPLETED'];
    if (!statuses.includes(status)) status = 'UPCOMING';

    // Finds the task by its ID and returns an error if the task is not found.
    const task = await Task.findByPk(id);
    if (!task)
      return res.status(404).json({errors: [i18n.__('errors.ERR_19')]});

    // Changing the task's completion status and saving changes
    // to the database.
    task.status = status;
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

const addPersonResponsible = async (req, res) => {

};

const removePersonResponsible = async (req, res) => {

};



/**
 * Deletes the task and its persons responsible records from the database.
 * @param {Object} req - Request object containing the ID of the task to delete.
 * @param {Object} res - Response object for sending the result to the client.
 */
const deleteTask = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    // Gets the deletable task id from request parameters and validates it.
    let { id } = req.params;
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

module.exports = {
  createTask, getUserTasks, changeTaskData, changeTaskStatus,
  addPersonResponsible, removePersonResponsible, deleteTask
};