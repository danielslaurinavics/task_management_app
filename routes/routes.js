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



router.get('/home', auth.authenticate, auth.goToDashboard);
router.get('/admin', auth.authenticate, auth.authorizeAdmin,
  (req, res) => res.render('./dashboard/admin_dashboard', { user: req.user }));
router.get('/dashboard', auth.authenticate,
  (req, res) => res.render('./dashboard/user_dashboard', { user: req.user }));



router.get('/users', auth.authenticate, auth.authorizeAdmin, user.getAllUsers);

router.route('/users/:id')
  .get(auth.authenticate, (req, res) => res.render('./users/settings', { user: req.user }))
  .put(auth.authenticate, user.changeData)
  .delete(auth.authenticate, user.deleteUser);

router.patch('/users/:id/block', auth.authenticate, auth.authorizeAdmin, user.blockUser);

router.patch('/users/:id/unblock', auth.authenticate, auth.authorizeAdmin, user.unblockUser);





router.route('/companies')
  .get(auth.authenticate, auth.authorizeAdmin, company.getAllCompanies)
  .post(auth.authenticate, auth.authorizeAdmin, company.createCompany);

router.get('/companies/user/:id', auth.authenticate, company.getUserCompanies);

router.get('/companies/create', auth.authenticate, auth.authorizeAdmin,
  (req, res) => res.render('./companies/create', { user: req.user }));

router.route('/companies/:id')
  .get(auth.authenticate, companyAuth.checkForAccess,
    (req, res) => res.render('./companies/dashboard', {user: req.user, company: req.company}))
  .put(auth.authenticate, companyAuth.checkForAccess, company.changeCompanyData)
  .delete(auth.authenticate, auth.authorizeAdmin, company.deleteCompany);

router.get('/companies/:id/settings', auth.authenticate, companyAuth.checkForAccess,
  (req, res) => res.render('./companies/settings', {user: req.user, company: req.company}));

router.route('/companies/:id/managers')
  .get(auth.authenticate, companyAuth.checkForAccess, company.getCompanyManagers)
  .post(auth.authenticate,/* companyAuth.checkForAccessOrAdmin,*/ company.addManager)
  .delete(auth.authenticate, companyAuth.checkForAccess, company.removeManager);

router.route('/companies/:id/teams')
  .get(auth.authenticate, companyAuth.checkForAccess, team.getAllCompanyTeams)
  .post(auth.authenticate, companyAuth.checkForAccess, team.createTeam)
  .delete(auth.authenticate, companyAuth.checkForAccess, team.deleteTeam)





router.get('/teams/create/:id', auth.authenticate, companyAuth.checkForAccess,
  (req, res) => res.render('./teams/create', {user: req.user, company: req.company}));

router.route('/teams/:id')
  .get(auth.authenticate, teamAuth.checkForAccess,
    (req, res) => res.render('./teams/list', { user: req.user, team: req.team }))
  .put(auth.authenticate, teamAuth.checkManager, team.changeTeamData)

router.route('/teams/:id/participants')
  /*.get(auth.authenticate, teamAuth.checkForAccess, team.getAllParticipants)*/
  .post(auth.authenticate, team.addToTeam)
  /*.patch(auth.authenticate, teamAuth.checkForAccess, teamAuth.checkManager, team.changeRole)*/
  .delete(auth.authenticate, teamAuth.checkForAccess, teamAuth.checkManager, team.removeFromTeam);



router.route('/list/user/:id')
  /*.get(auth.authenticate, task.getListTasks) */
  .post(auth.authenticate, task.createTask)
  .put(auth.authenticate, task.changeTaskData)
  .patch(auth.authenticate, task.changeTaskStatus)
  .delete(auth.authenticate, task.deleteTask);

router.route('/list/team/:id')
 /* .get(auth.authenticate, teamAuth.checkForAccess, task.getListTasks) */
  .post(auth.authenticate, teamAuth.checkForAccess, teamAuth.checkManager, task.createTask)
  .put(auth.authenticate, teamAuth.checkForAccess, teamAuth.checkManager, task.changeTaskData)
  .patch(auth.authenticate, teamAuth.checkForAccess, task.changeTaskStatus)
  .delete(auth.authenticate, teamAuth.checkForAccess, teamAuth.checkManager, task.deleteTask);

router.route('/task/:id/persons')
 /* .get(auth.authenticate, task.getPersonsResponsible) */
  .post(auth.authenticate, teamAuth.checkForAccess, teamAuth.checkManager, task.addPersonResponsible)
  .delete(auth.authenticate, teamAuth.checkForAccess, teamAuth.checkManager, task.removePersonResponsible);

module.exports = router;
