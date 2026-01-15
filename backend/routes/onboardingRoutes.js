const express = require('express');
const router = express.Router();
const onboardingController = require('../controllers/onboardingController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Protected routes - require authentication
router.post('/complete', authenticateToken, onboardingController.completeOnboarding.bind(onboardingController));
router.get('/status', authenticateToken, onboardingController.getOnboardingStatus.bind(onboardingController));
router.get('/profile', authenticateToken, onboardingController.getProfile.bind(onboardingController));
router.get('/employee-id', authenticateToken, onboardingController.getOrGenerateEmployeeId.bind(onboardingController));

module.exports = router;
