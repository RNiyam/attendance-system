const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const profileController = require('../controllers/profileController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// All routes require authentication
router.use(authenticateToken);

// Profile routes
router.get('/', profileController.getProfile.bind(profileController));
router.put('/', profileController.updateProfile.bind(profileController));

// Preferences routes
router.get('/preferences', profileController.getPreferences.bind(profileController));
router.put('/preferences', profileController.updatePreferences.bind(profileController));

// Password change route
router.post('/change-password', [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
], validateRequest, profileController.changePassword.bind(profileController));

module.exports = router;
