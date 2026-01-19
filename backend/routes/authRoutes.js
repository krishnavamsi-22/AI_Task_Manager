const express = require('express');
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/register/manager', authController.registerManager);
router.post('/register/employee', authController.registerEmployee);
router.post('/login', authController.login);
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile/skills', authMiddleware, authController.updateSkills);

module.exports = router;
