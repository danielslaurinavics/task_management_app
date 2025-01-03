const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authenticate');
const { setLocale } = require('../middleware/locale');


router.get('/', (req, res) => res.render('./index/index'));

router.get('/locale/set', setLocale);

router.get('/login', (req, res) => res.render('./users/login'));
router.post('/login', userController.login);

router.get('/register', (req, res) => res.render('./users/register'));
router.post('/register', userController.register);

router.get('/dashboard', authMiddleware.authenticate, (req, res) => res.render('./dashboard/user_dashboard'));

router.get('/admin', authMiddleware.authenticate, authMiddleware.authorizeAdmin, (req, res) => res.render('./dashboard/admin_dashboard'));


module.exports = router;