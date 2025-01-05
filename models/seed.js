const bcrypt = require('bcryptjs')
const sequelize = require('../config/database');

const { User } = require('./User');
const { Company, CompanyManager } = require('./Company');
const { Team, TeamParticipant } = require('./Team');
const { TaskList } = require('./TaskList');
const { Task, TaskPersons } = require('./Task');

async function seed() {
  await sequelize.sync({ force: true });
  
  const admin = await User.create({
    name: 'Administrators',
    email: 'admin@taskapp.lv',
    password: await bcrypt.hash('admins420', 10),
    phone: '+37100000000',
    is_admin: true
  });

  sequelize.close();
  console.log('Seeding successful!');
}

seed();