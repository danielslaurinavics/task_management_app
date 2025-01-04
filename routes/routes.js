// Importing needed third-party libraries and initializing the routing middleware.
const express = require('express');
const router = express.Router();

// Importing local controllers.
const userController = require('../controllers/userController');
const companyController = require('../controllers/companyController');
const teamController = require('../controllers/teamController');
const taskController = require('../controllers/taskController');

// Importing local middleware.
const authMiddleware = require('../middleware/authenticate');
const companyMiddleware = require('../middleware/company');
const { setLocale } = require('../middleware/locale');



// Index page route
router.get('/', (req, res) => res.render('./index/index'));

// Locale setting route
router.get('/locale/set', setLocale);

// Login and logout routes
router.get('/login', authMiddleware.checkIfLoggedIn, (req, res) => res.render('./users/login'));
router.post('/login', authMiddleware.checkIfLoggedIn, userController.login);
router.post('/logout', authMiddleware.authenticate, userController.logout);

// Registration routes
router.get('/register', authMiddleware.checkIfLoggedIn, (req, res) => res.render('./users/register'));
router.post('/register', authMiddleware.checkIfLoggedIn, userController.register);

// Dashboard routes
router.get('/home', authMiddleware.authenticate, authMiddleware.goToDashboard);
router.get('/dashboard', authMiddleware.authenticate, (req, res) => res.render('./dashboard/user_dashboard', { user: req.user }));
router.get('/admin', authMiddleware.authenticate, authMiddleware.authorizeAdmin, (req, res) => res.render('./dashboard/admin_dashboard', { user: req.user }));

// User setting routes
router.get('/settings', authMiddleware.authenticate, (req, res) => res.render('./users/settings', { user: req.user }));
router.put('/settings/change/:id', authMiddleware.authenticate, userController.changeData);

// User blocking routes
router.put('/user/block/:id', authMiddleware.authenticate, authMiddleware.authorizeAdmin, userController.blockUser);
router.put('/user/unblock/:id', authMiddleware.authenticate, authMiddleware.authorizeAdmin, userController.unblockUser);

// User deletion route
router.delete('/user/:id/delete/self', authMiddleware.authenticate, userController.deleteSelf);
router.delete('/user/:id/delete', authMiddleware.authenticate, authMiddleware.authorizeAdmin,userController.deleteUser);

// Personal task list route
router.get('/user/:id/list', authMiddleware.authenticate, (req, res) => res.render('./tasklists/personal_list', { user: req.user }));


// User information routes
router.get('/user/get', authMiddleware.authenticate, authMiddleware.authorizeAdmin, userController.getAllUsers);



// Company routes
router.get('/company/:id', authMiddleware.authenticate, (req, res) => res.render('./companies/dashboard', { user: req.user, company: req.company }));
router.get('/company/info/:user_id', authMiddleware.authenticate, companyController.getUserCompanies);
router.post('/company/create', authMiddleware.authenticate, authMiddleware.authorizeAdmin, companyController.createCompany);
router.post('/company/:id/manager/add', authMiddleware.authenticate, companyController.addManager);
router.put('/company/:id/change', authMiddleware.authenticate, companyController.changeCompanyData);
router.delete('/company/:id/delete', authMiddleware.authenticate, authMiddleware.authorizeAdmin, companyController.deleteCompany);
router.delete('/company/:id/manager/delete', authMiddleware.authenticate, companyController.removeManager);



// Team routes
router.get('/team/:id', authMiddleware.authenticate, (req, res) => res.render('./teams/dashboard', { team: req.team }));
router.post('/team/create', authMiddleware.authenticate, teamController.createTeam);
//router.post('/team/:id/add')
//router.put('/team/:id/change')
//router.put('/team/:id/role/manager')
//router.put('/team/:id/role/participant')
//router.delete('/team/:id/delete')
//router.delete('/team/:id/remove')



// Task routes

router.get('/tasks/personal/:user_id', authMiddleware.authenticate, (req, res) => res.render('./tasklists/personal_list'));
router.get('/tasks/team/:team_id', authMiddleware.authenticate, (req, res) => res.render('./tasklists/team_list'));

router.get('/tasks/user/:user_id', authMiddleware.authenticate, taskController.getUserTasks);
// router.get('/tasks/team/:id')
router.post('/tasks/create', authMiddleware.authenticate, taskController.createTask);
// router.put('/task/:id/change')
// router.put('/task/:id/status')
// router.delete('/task/:id/delete')

module.exports = router;