const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const dashboardController = require('../controllers/dashboardController');
const tasksController = require('../controllers/tasksController');
const scheduleController = require('../controllers/scheduleController');
const notesController = require('../controllers/notesController');
const leaveController = require('../controllers/leaveController');
const breakController = require('../controllers/breakController');

// Dashboard routes
router.get('/employee', authenticateToken, dashboardController.getEmployeeDashboard.bind(dashboardController));
router.get('/admin', authenticateToken, dashboardController.getAdminDashboard.bind(dashboardController));
router.get('/calendar', authenticateToken, dashboardController.getCalendar.bind(dashboardController));

// Tasks routes
router.post('/tasks', authenticateToken, tasksController.createTask.bind(tasksController));
router.get('/tasks', authenticateToken, tasksController.getTasks.bind(tasksController));
router.put('/tasks/:id', authenticateToken, tasksController.updateTask.bind(tasksController));
router.delete('/tasks/:id', authenticateToken, tasksController.deleteTask.bind(tasksController));

// Schedule routes
router.post('/schedule', authenticateToken, scheduleController.createEvent.bind(scheduleController));
router.get('/schedule', authenticateToken, scheduleController.getEvents.bind(scheduleController));
router.put('/schedule/:id', authenticateToken, scheduleController.updateEvent.bind(scheduleController));
router.delete('/schedule/:id', authenticateToken, scheduleController.deleteEvent.bind(scheduleController));

// Notes routes
router.post('/notes', authenticateToken, notesController.createNote.bind(notesController));
router.get('/notes', authenticateToken, notesController.getNotes.bind(notesController));
router.put('/notes/:id', authenticateToken, notesController.updateNote.bind(notesController));
router.delete('/notes/:id', authenticateToken, notesController.deleteNote.bind(notesController));

// Leave routes
router.post('/leave', authenticateToken, leaveController.createLeaveRequest.bind(leaveController));
router.get('/leave', authenticateToken, leaveController.getLeaveRequests.bind(leaveController));
router.put('/leave/:id/approve', authenticateToken, leaveController.approveLeaveRequest.bind(leaveController));
router.put('/leave/:id/reject', authenticateToken, leaveController.rejectLeaveRequest.bind(leaveController));

// Break routes
router.post('/break/start', authenticateToken, breakController.startBreak.bind(breakController));
router.post('/break/end', authenticateToken, breakController.endBreak.bind(breakController));

module.exports = router;
