const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/authenticate');
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

/*
// Company routes
router.get('/company/:id')
router.get('/company/:id/data')
router.post('/company/create', authMiddleware.authenticate, authMiddleware.authorizeAdmin, companyController.createCompany);
router.post('/company/:id/manager/add')
router.put('/company/:id/change')
router.delete('/company/:id/delete')
router.delete('/company/:id/manager/delete')
*/

/*
// Team routes
router.get('/team/:id')
router.post('/team/create')
router.put('/team/change/:id')
router.delete('/team/delete/:id')
*/

// Task routes
router.get('/tasks/user/:id', authMiddleware.authenticate, taskController.getUserTasks);
// router.get('/tasks/team/:id')
router.post('/tasks/create', authMiddleware.authenticate, taskController.createTask);
// router.put('/task/change/:id')
// router.delete('/task/delete/:id')



module.exports = router;