const express = require('express');
const router = express.Router();

const user = require('../controllers/userController');
const company = require('../controllers/companyController');
const team = require('../controllers/teamController');
const task = require('../controllers/taskController');

const auth = require('../middleware/auth');
const companyAuth = require('../middleware/companyAuth');
const teamAuth = require('../middleware/teamAuth');
const { setLocale } = require('../middleware/locale');



router.get('/', (req, res) => res.render('index'));

router.get('/locale/set', setLocale);

router.route('/login')
  .get(auth.redirectIfLoggedIn, (req, res) => res.render('./users/login'))
  .post(auth.redirectIfLoggedIn, user.login);

router.post('/logout', auth.authenticate, user.logout);

router.route('/register')
  .get(auth.redirectIfLoggedIn, (req, res) => res.render('./users/register'))
  .post(auth.redirectIfLoggedIn, user.register);


// Dashboard and its redirection routes.
router.get('/home', auth.authenticate, auth.goToDashboard);
router.get('/admin', auth.authenticate, auth.authorizeAdmin,
  (req, res) => res.render('./dashboard/admin_dashboard', { user: req.user }));
router.get('/dashboard', auth.authenticate, auth.usersOnly,
  (req, res) => res.render('./dashboard/user_dashboard', { user: req.user }));


// User function routes
router.get('/users', auth.authenticate, auth.authorizeAdmin, user.getAllUsers);

router.route('/users/:id')
  .get(auth.authenticate, (req, res) => res.render('./users/settings', { user: req.user }))
  .put(auth.authenticate, user.changeData)
  .patch(auth.authenticate, auth.authorizeAdmin, user.block)
  .delete(auth.authenticate, user.deleteUser);

router.get('/users/:id/list', auth.authenticate, auth.usersOnly, (req, res) => res.render('./lists/user', { user: req.user }));


// Company function routes
router.route('/companies')
  .get(auth.authenticate, auth.authorizeAdmin, company.getAllCompanies)
  .post(auth.authenticate, auth.authorizeAdmin, company.createCompany);

router.get('/companies/user/:id', auth.authenticate, company.getUserCompanies);

router.get('/companies/create', auth.authenticate, auth.authorizeAdmin,
  (req, res) => res.render('./companies/create', { user: req.user }));

router.route('/companies/:id')
  .get(auth.authenticate, auth.usersOnly, companyAuth.checkForAccess,
    (req, res) => res.render('./companies/dashboard', {user: req.user, company: req.company}))
  .put(auth.authenticate, companyAuth.checkForAccess, company.changeCompanyData)
  .delete(auth.authenticate, auth.authorizeAdmin, company.deleteCompany);

router.get('/companies/:id/settings', auth.authenticate, auth.usersOnly, companyAuth.checkForAccess,
  (req, res) => res.render('./companies/settings', {user: req.user, company: req.company}));

router.route('/companies/:id/managers')
  .get(auth.authenticate, companyAuth.checkForAccess, user.getCompanyUsers)
  .post(auth.authenticate, company.addManager)
  .delete(auth.authenticate, companyAuth.checkForAccess, company.removeManager);

router.route('/companies/:id/teams')
  .get(auth.authenticate, companyAuth.checkForAccess, team.getAllCompanyTeams)
  .post(auth.authenticate, companyAuth.checkForAccess, team.createTeam)
  .delete(auth.authenticate, companyAuth.checkForAccess, team.deleteTeam)


// Team function routes
router.get('/teams/create/:id', auth.authenticate, auth.usersOnly, companyAuth.checkForAccess,
  (req, res) => res.render('./teams/create', {user: req.user, company: req.company}));

router.get('/teams/user/:id', auth.authenticate, team.getUserTeams);

router.route('/teams/:id')
  .get(auth.authenticate, auth.usersOnly, teamAuth.checkForAccess,
    (req, res) => res.render('./teams/team', { user: req.user, team: req.team }))

router.route('/teams/:id/participants')
  .get(auth.authenticate, teamAuth.checkForAccess, user.getTeamUsers)
  .post(auth.authenticate, team.addToTeam)
  .patch(auth.authenticate, teamAuth.checkForAccess, teamAuth.checkManager, team.changeRole)
  .delete(auth.authenticate, teamAuth.checkForAccess, teamAuth.checkManager, team.removeFromTeam);


  // Task (and their list) routes
router.route('/list/user/:id')
  .get(auth.authenticate, task.getUserListTasks)
  .post(auth.authenticate, task.createTask)
  .put(auth.authenticate, task.changeTaskData)
  .patch(auth.authenticate, task.changeTaskStatus)
  .delete(auth.authenticate, task.deleteTask);

router.route('/list/team/:id')
  .get(auth.authenticate, teamAuth.checkForAccess, task.getTeamListTasks)
  .post(auth.authenticate, teamAuth.checkForAccess, teamAuth.checkManager, task.createTask)
  .put(auth.authenticate, teamAuth.checkForAccess, teamAuth.checkManager, task.changeTaskData)
  .patch(auth.authenticate, teamAuth.checkForAccess, task.changeTaskStatus)
  .delete(auth.authenticate, teamAuth.checkForAccess, teamAuth.checkManager, task.deleteTask);

router.get('/tasks/:id/data', auth.authenticate, task.getTaskData);

router.route('/tasks/:id/persons')
  .post(auth.authenticate, teamAuth.checkForAccess, teamAuth.checkManager, task.addPersonResponsible)
  .delete(auth.authenticate, teamAuth.checkForAccess, teamAuth.checkManager, task.removePersonResponsible);

router.get('/tasks/user/edit/:id', auth.authenticate, (req, res) => res.render('./lists/settings', { user: req.user, team: null }));
router.get('/tasks/team/:id/edit/:task_id', auth.authenticate, teamAuth.checkForAccess, teamAuth.checkManager,
  (req, res) => res.render('./lists/settings', { user: req.user, team: req.team }));

module.exports = router;
