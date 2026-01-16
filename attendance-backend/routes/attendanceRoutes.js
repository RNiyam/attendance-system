const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const statsController = require('../controllers/statsController');

// Check-in/Check-out
router.post('/checkin', attendanceController.checkIn.bind(attendanceController));

// Get attendance records
router.get('/', attendanceController.getAttendance.bind(attendanceController));

// Get attendance statistics
router.get('/stats', statsController.getStats.bind(statsController));

module.exports = router;
