const i18n = require('i18n');

const { User } = require('../models/User');
const { TaskList } = require('../models/TaskList');
const { Task, TaskPersons } = require('../models/Task');


const createTask = async (req, res) => {
  const errors = [];
  try {
    let { name, description, priority, dueDate, listId } = req.body;

    name = name.trim();
    description = description.trim();
    priority = priority.trim();
    dueDate = dueDate.trim();
    listId = parseInt(listId.trim(), 10);

    const validations = [
      {condition: !name || !listId, error: 'ERR_01'},
      {condition: name && name.length > 255, error: 'ERR_04'}
    ];
    for (const { condition, error } of validations) {
      if (condition) errors.push(i18n.__(`errors.${error}`));
    };

    const listFound = await TaskList.findOne({
      where: { id: listId }
    });
    if (!listFound) return res.status(404);
    
    const newTask = await Task.create({
      name,
      description: description || null,
      priority: priority || 'LOW',
      dueDate: dueDate ? new Date(dueDate) : null,
      list_id: listId
    });

    if (listFound.owner_user) {
      const newTaskPerson = await TaskPersons.create({
        task_id: newTask.id,
        user_id: listFound.owner_user
      });
    }

    res.status(201).json({ success: true, message: i18n.__('success.SUC_16') });
  } catch (error) {
    console.error(error);
    errors.push(i18n.__('errors.ERR_18'));
    res.status(500).json({ errors });
  }
};


const getUserTasks = async (req, res) => {
  const errors = [];
  try {
    let { id: userId } = req.params;
    if (!userId) return res.status(400);

    const tasks = await Task.findAll({
      include: [
        {
          model: User,
          attributes: [],
          through: {
            attributes: []
          },
          where: { id: userId },
          required: true
        }
      ]
    });

    tasks.forEach(task => {
      task.status = i18n.__(`tasks.statuses.${task.status.toLowerCase()}`);
      task.priority = i18n.__(`tasks.priorities.${task.priority.toLowerCase()}`);
    });

    return res.status(200).json({ tasks })
  } catch (error) {
    console.error(error);
    errors.push(i18n.__('errors.ERR_18'));
    return res.status(500).json({ errors });
  }
}

const changeTaskData = async (req, res) => {

};

const changeTaskStatus = async (req, res) => {

};

const addPersonResponsible = async (req, res) => {

};

const removePersonResponsible = async (req, res) => {

};

const deleteTask = async (req, res) => {

};

module.exports = {
  createTask, getUserTasks, changeTaskData, changeTaskStatus,
  addPersonResponsible, removePersonResponsible, deleteTask
};