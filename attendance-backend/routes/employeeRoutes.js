const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');

// Register new employee
router.post('/register', employeeController.registerEmployee.bind(employeeController));

// Get all employees (both /api/employee and /api/employees)
router.get('/', employeeController.getAllEmployees.bind(employeeController));

// Get employee by code
router.get('/:empCode', employeeController.getEmployeeByCode.bind(employeeController));

module.exports = router;
