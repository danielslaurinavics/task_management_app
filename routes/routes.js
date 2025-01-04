// Importing needed third-party libraries and initializing the routing middleware.
const express = require('express');
const router = express.Router();

// Importing local controllers.
const userCon = require('../controllers/userController');
const companyCon = require('../controllers/companyController');
const teamCon = require('../controllers/teamController');
const taskCon = require('../controllers/taskController');

// Importing local middleware.
const auth = require('../middleware/authenticate');
const companyMid = require('../middleware/company');
const { setLocale } = require('../middleware/locale');



router.get('/', (req, res) => res.render('./index/index'));
router.get('/locale/set', setLocale);

// Login and logout routes
router.get('/login', auth.checkIfLoggedIn, (req, res) => res.render('./users/login'));
router.post('/login', auth.checkIfLoggedIn, userCon.login);
router.post('/logout', auth.authenticate, userCon.logout);

// Registration routes
router.get('/register', auth.checkIfLoggedIn, (req, res) => res.render('./users/register'));
router.post('/register', auth.checkIfLoggedIn, userCon.register);

// Dashboard routes
router.get('/home', auth.authenticate, auth.goToDashboard);
router.get('/dashboard', auth.authenticate, (req, res) => res.render('./dashboard/user_dashboard', { user: req.user }));
router.get('/admin', auth.authenticate, auth.authorizeAdmin, (req, res) => res.render('./dashboard/admin_dashboard', { user: req.user }));

// User setting routes
router.get('/settings', auth.authenticate, (req, res) => res.render('./users/settings', { user: req.user }));
router.put('/settings/change/:id', auth.authenticate, userCon.changeData);

// User blocking routes
router.put('/user/:id/block', auth.authenticate, auth.authorizeAdmin, userCon.blockUser);
router.put('/user/:id/unblock', auth.authenticate, auth.authorizeAdmin, userCon.unblockUser);

// User deletion route
router.delete('/user/:id/delete/self', auth.authenticate, userCon.deleteSelf);
router.delete('/user/:id/delete', auth.authenticate, auth.authorizeAdmin,userCon.deleteUser);

// Personal task list route
router.get('/user/:id/list', auth.authenticate, (req, res) => res.render('./tasklists/personal_list', { user: req.user }));


// User information routes
router.get('/user/get', auth.authenticate, auth.authorizeAdmin, userCon.getAllUsers);



// Company routes
router.get('/create/company', auth.authenticate, auth.authorizeAdmin, (req, res) => res.render('./companies/create', { user: req.user }));
router.post('/create/company', auth.authenticate, auth.authorizeAdmin, companyCon.createCompany);
router.post('/company/:id/manager/add', auth.authenticate, companyCon.addManager);

router.get('/company/:id', auth.authenticate, companyMid.checkForAccess, (req, res) => res.render('./companies/dashboard', { user: req.user, company: req.company }));
router.get('/get/company', auth.authenticate, auth.authorizeAdmin, companyCon.getAllCompanies);
router.get('/company/get/:user_id', auth.authenticate, companyCon.getUserCompanies);
router.get('/company/:id/manager/get', auth.authenticate, companyMid.checkForAccess, companyCon.getCompanyManagers);


router.put('/company/:id/change', auth.authenticate, companyCon.changeCompanyData);

router.delete('/company/:id/delete', auth.authenticate, auth.authorizeAdmin, companyCon.deleteCompany);
router.delete('/company/:id/manager/delete', auth.authenticate, companyCon.removeManager);


// Team routes
router.get('/team/get/:id', auth.authenticate, companyMid.checkForAccess, teamCon.getAllCompanyTeams);
router.get('/create/team/:id', auth.authenticate, companyMid.checkForAccess, (req, res) => res.render('./teams/create', { user: req.user, company: req.company }));
router.post('/create/team/:id', auth.authenticate, companyMid.checkForAccess, teamCon.createTeam);

router.get('/team/:team_id', auth.authenticate, (req, res) => res.render('./teams/dashboard', { user: req.user }));




router.delete('/team/:id/:team_id/delete', auth.authenticate, companyMid.checkForAccess, teamCon.deleteTeam);

// Task routes

router.get('/tasks/personal/:user_id', auth.authenticate, (req, res) => res.render('./tasklists/personal_list'));
router.get('/tasks/team/:team_id', auth.authenticate, (req, res) => res.render('./tasklists/team_list'));

router.get('/tasks/user/:user_id', auth.authenticate, taskCon.getUserTasks);
// router.get('/tasks/team/:id')
router.post('/tasks/create', auth.authenticate, taskCon.createTask);
// router.put('/task/:id/change')
// router.put('/task/:id/status')
// router.delete('/task/:id/delete')

module.exports = router;