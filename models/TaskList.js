const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const { User } = require('./User');
const { Team } = require('./Team');

const TaskList = sequelize.define('TaskList', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  is_team_list: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  owner_user: {
    type: DataTypes.INTEGER,
    allowNull: true,
    unique: true,
    references: {
      model: User,
      key: 'id'
    }
  },
  owner_team: {
    type: DataTypes.INTEGER,
    allowNull: true,
    unique: true,
    references: {
      model: Team,
      key: 'id'
    }
  }
}, {
  timestamps: false,
  tableName: 'task_lists',
});

TaskList.belongsTo(User, { foreignKey: 'owner_user', onDelete: 'CASCADE' });
TaskList.belongsTo(Team, { foreignKey: 'owner_team', onDelete: 'CASCADE' });

module.exports = { TaskList };