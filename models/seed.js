const bcrypt = require('bcryptjs')
const sequelize = require('../config/database');

const { User } = require('./User');
const { Company, CompanyManager } = require('./Company');
const { Team, TeamParticipant } = require('./Team');
const { TaskList } = require('./TaskList');
const { Task, TaskPersons } = require('./Task');

async function seed() {
  await sequelize.sync({ force: true });

  const user_a = await User.create({
    name: 'Daniels Laurinavičs',
    email: '15daniels02@gmail.com',
    password: await bcrypt.hash('bremze420', 10),
    phone: '+37199999999'
  });

  const a_list = await TaskList.create({ owner_user: user_a.id });

  const user_b = await User.create({
    name: 'Jānis Paraudziņš',
    email: 'janka@inbox.lv',
    password: await bcrypt.hash('janka420', 10),
    phone: '+37166666666'
  });

  const b_list = await TaskList.create({ owner_user: user_b.id });

  const admin = await User.create({
    name: 'Administrators',
    email: 'admin@taskapp.lv',
    password: await bcrypt.hash('admins420', 10),
    phone: '+37100000000',
    is_admin: true
  });

  console.log('Users created!');

  const company = await Company.create({
    name: 'D.L. Consulting',
    description: 'Sliktākais programmatūras izstrādes uzņēmums Latvijā. Mūžīgie parādi, mūžīgās sūdzības.',
    email: 'info@dl-consulting.lv',
    phone: '+37166699666'
  });

  const companyManager = await CompanyManager.create({ company_id: company.id, user_id: user_a.id });

  const team_a = await Team.create({
    name: 'Projektēšanas nodaļa',
    description: 'Mēs neprotam taisīt projektējumus!',
    owner_company: company.id
  });

  const team_a_list = await TaskList.create({ is_team_list: true, owner_team: team_a.id });

  const team_b = await Team.create({
    name: 'Izstrādes nodaļa',
    description: 'Mēs zinam, kas ir cout, bet nezinam, kas ir async...',
    owner_company: company.id
  });

  const team_b_list = await TaskList.create({ is_team_list: true, owner_team: team_b.id });

  console.log('Company and teams created!');

  const teamManager_a = await TeamParticipant.create({ team_id: team_a.id, user_id: user_a.id, is_manager: true });
  const teamManager_b = await TeamParticipant.create({ team_id: team_b.id, user_id: user_a.id, is_manager: true });
  const teamPart = await TeamParticipant.create({ team_id: team_b.id, user_id: user_b.id });



  const a_personal_a = await Task.create({ name: 'Izlemt par likvidāciju', priority: 2, list_id: a_list.id });
  const aba_res = await TaskPersons.create({ task_id: a_personal_a.id, user_id: user_a.id });
  const a_personal_b = await Task.create({ name: 'Pārdot visu', description: 'Lai VID neatrod!', status: 1,
    priority: 2, due_date: '2025-01-31 16:00', list_id: a_list.id });
  const abb_res = await TaskPersons.create({ task_id: a_personal_b.id, user_id: user_a.id });
  const a_personal_c = await Task.create({ name: 'Atrast meiteni', description: 'Lai VID neatrod!', priority: 0, list_id: a_list.id });
  const abc_res = await TaskPersons.create({ task_id: a_personal_c.id, user_id: user_a.id });
  const a_personal_d = await Task.create({ name: 'Atrast veikalu', description: 'Lai VID neatrod!',
    priority: 1, due_date: '2025-05-06 22:00', list_id: a_list.id });
  const abd_res = await TaskPersons.create({ task_id: a_personal_d.id, user_id: user_a.id });
  console.log('Tasks created!');

  console.log('Seeding done!');
  sequelize.close();
}

seed();