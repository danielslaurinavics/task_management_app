const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');

const { User } = require('./User');
const { Company, CompanyManager } = require('./Company');
const { Team, TeamParticipant } = require('./Team');
const { TaskList } = require('./TaskList');
const { Task, TaskPerson } = require('./Task');

( async () => {
  try {
    await sequelize.sync({ force: true });
    console.log('All database tables have been created successfully!');
  } catch (error) {
    console.error('Failed to create database tables', error);
  } finally {
    await sequelize.close();
  }
})();