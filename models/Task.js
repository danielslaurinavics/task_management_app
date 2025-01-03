const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const { User } = require('./User');
const { TaskList } = require('./TaskList');

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(16),
    allowNull: false,
    defaultValue: 'UPCOMING'
  },
  priority: {
    type: DataTypes.STRING(16),
    allowNull: false,
    defaultValue: 'LOW'
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  list_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: TaskList,
      key: 'id'
    }
  }
}, {
  timestamps: true,
  tableName: 'tasks'
});

Task.belongsTo(TaskList, { foreignKey: 'list_id', onDelete: 'CASCADE' });

const TaskPersons = sequelize.define('tasklist', {
  task_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Task,
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  }
}, {
  tableName: 'task_persons'
});

Task.belongsToMany(User, {
  through: TaskPersons,
  foreignKey: 'task_id',
  otherKey: 'user_id',
  onDelete: 'CASCADE'
});

User.belongsToMany(Task, {
  through: TaskPersons,
  foreignKey: 'user_id',
  otherKey: 'task_id',
  onDelete: 'CASCADE'
})

module.exports = { Task, TaskPersons };