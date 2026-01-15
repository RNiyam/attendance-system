const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Public routes
router.post('/signup', authController.signup.bind(authController));
router.post('/login', authController.login.bind(authController));
router.post('/password-reset/request', authController.requestPasswordReset.bind(authController));
router.post('/password-reset/reset', authController.resetPassword.bind(authController));

// Protected routes
router.get('/me', authenticateToken, authController.getCurrentUser.bind(authController));

module.exports = router;
