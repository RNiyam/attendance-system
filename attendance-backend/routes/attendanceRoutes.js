const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const statsController = require('../controllers/statsController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Check-in/Check-out
router.post('/checkin', attendanceController.checkIn.bind(attendanceController));

// Clock out (without face verification) - requires authentication
router.post('/clockout', authenticateToken, attendanceController.clockOut.bind(attendanceController));

// Get attendance records
router.get('/', attendanceController.getAttendance.bind(attendanceController));

// Get attendance statistics
router.get('/stats', statsController.getStats.bind(statsController));

module.exports = router;
