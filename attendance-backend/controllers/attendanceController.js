const db = require('../db');
const faceService = require('../services/faceService');
const moment = require('moment');

class AttendanceController {
  /**
   * Check-in/Check-out attendance
   */
  async checkIn(req, res) {
    try {
      const { empCode, image } = req.body;

      if (!empCode || !image) {
        return res.status(400).json({ error: 'empCode and image are required' });
      }

      // Validate image format
      if (typeof image !== 'string' || !image.startsWith('data:image/')) {
        return res.status(400).json({ error: 'Invalid image format. Expected base64 data URL.' });
      }

      // Get employee with face embedding - CRITICAL: Must match exact emp_code
      const [employees] = await db.execute(
        'SELECT id, emp_code, name, face_embedding FROM employees WHERE emp_code = ?',
        [empCode]
      );

      if (employees.length === 0) {
        return res.status(404).json({ error: `Employee with code "${empCode}" not found. Please register first.` });
      }

      if (employees.length > 1) {
        console.error(`ERROR: Multiple employees found with code "${empCode}"! This should not happen.`);
        return res.status(500).json({ error: 'Database error: Multiple employees with same code found.' });
      }

      const employee = employees[0];
      
      // Verify we're using the correct employee's embedding
      if (employee.emp_code !== empCode) {
        console.error(`ERROR: Employee code mismatch! Requested: "${empCode}", Found: "${employee.emp_code}"`);
        return res.status(500).json({ error: 'Employee code mismatch error.' });
      }
      
      console.log(`🔍 Verifying face for employee: ${employee.name} (${employee.emp_code}), ID: ${employee.id}`);

      // mysql2 automatically parses JSON columns, so face_embedding is already an array
      let storedEmbedding = employee.face_embedding;
      
      // Validate embedding is an array with valid length
      if (!Array.isArray(storedEmbedding)) {
        console.error('face_embedding is not an array. Type:', typeof storedEmbedding);
        return res.status(500).json({ 
          error: 'Invalid face embedding format. Please re-register the employee.' 
        });
      }
      
      if (storedEmbedding.length === 0) {
        return res.status(500).json({ 
          error: 'Face embedding is empty. Please re-register the employee.' 
        });
      }
      
      // Validate it's a numeric array (face embeddings should be numbers)
      if (!storedEmbedding.every(val => typeof val === 'number' && !isNaN(val))) {
        return res.status(500).json({ 
          error: 'Face embedding contains invalid values. Please re-register the employee.' 
        });
      }

      // Verify face with Python service
      const verificationResult = await faceService.verifyFace(storedEmbedding, image);

      // STRICT VERIFICATION CHECKS
      const confidence = verificationResult.confidence || 0;
      const distance = verificationResult.distance || 1.0;
      const match = verificationResult.match || false;
      
      // Check 1: Must have match = true
      if (!match) {
        return res.status(401).json({
          error: 'Face verification failed. The face does not match the registered employee.',
          confidence: confidence,
          distance: distance,
          message: `Face distance (${distance.toFixed(4)}) exceeds threshold. This appears to be a different person.`
        });
      }

      // Check 2: Confidence must be at least 55% (VERY STRICT - prevents false matches)
      const MIN_CONFIDENCE = 0.55;
      if (confidence < MIN_CONFIDENCE) {
        return res.status(401).json({
          error: 'Face verification failed. Confidence too low.',
          confidence: confidence,
          distance: distance,
          message: `Confidence (${(confidence * 100).toFixed(1)}%) is below required threshold (${(MIN_CONFIDENCE * 100).toFixed(0)}%). This appears to be a different person.`
        });
      }

      // Check 3: Distance must be below very strict threshold (0.45)
      const MAX_DISTANCE = 0.45;
      if (distance >= MAX_DISTANCE) {
        return res.status(401).json({
          error: 'Face verification failed. Face distance too high.',
          confidence: confidence,
          distance: distance,
          message: `Face distance (${distance.toFixed(4)}) exceeds maximum allowed (${MAX_DISTANCE}). This appears to be a different person.`
        });
      }

      console.log(`✅ Face verification PASSED for ${empCode}: distance=${distance.toFixed(4)}, confidence=${(confidence * 100).toFixed(1)}%`);

      // Determine status (IN or OUT) - simple logic: check last attendance
      const [lastAttendance] = await db.execute(
        'SELECT status, created_at FROM attendance WHERE emp_id = ? ORDER BY created_at DESC LIMIT 1',
        [employee.id]
      );

      let status = 'IN';
      let clockInTime = null;
      let clockOutTime = null;
      let totalHours = 0;
      let isLate = false;
      const expectedTime = '09:00:00';

      if (lastAttendance.length > 0 && lastAttendance[0].status === 'IN') {
        status = 'OUT';
        // Calculate total hours
        const clockIn = new Date(lastAttendance[0].created_at);
        const clockOut = new Date();
        totalHours = (clockOut - clockIn) / (1000 * 60 * 60); // Convert to hours
        clockOutTime = moment(clockOut).format('HH:mm:ss');
      } else {
        // Check if late
        const now = moment();
        const expected = moment(now.format('YYYY-MM-DD') + ' ' + expectedTime);
        isLate = now.isAfter(expected);
        clockInTime = moment().format('HH:mm:ss');
      }

      // Record attendance
      const [result] = await db.execute(
        'INSERT INTO attendance (emp_id, status, confidence, clock_in_time, clock_out_time, total_hours, is_late, expected_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [employee.id, status, confidence, clockInTime, clockOutTime, totalHours, isLate, expectedTime]
      );

      console.log(`📝 Attendance recorded: ${employee.name} (${empCode}) - ${status}`);

      res.json({
        success: true,
        message: `Attendance marked as ${status}`,
        employee: {
          id: employee.id,
          empCode: employee.emp_code,
          name: employee.name
        },
        status,
        confidence: confidence
      });
    } catch (error) {
      console.error('Check-in error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  /**
   * Clock out with face verification - validates against ORIGINAL face from onboarding
   */
  async clockOut(req, res) {
    try {
      const { empCode, image } = req.body;
      const userId = req.user?.userId;

      if (!empCode || !image) {
        return res.status(400).json({ error: 'empCode and image are required' });
      }

      // Validate image format
      if (typeof image !== 'string' || !image.startsWith('data:image/')) {
        return res.status(400).json({ error: 'Invalid image format. Expected base64 data URL.' });
      }

      // Get employee with face embedding - try to match with user if userId is provided
      let employees;
      if (userId) {
        // Try to get employee linked to user through user_profiles (the ORIGINAL face from onboarding)
        [employees] = await db.execute(
          `SELECT e.id, e.emp_code, e.name, e.face_embedding 
           FROM employees e
           JOIN user_profiles up ON CAST(e.emp_code AS CHAR) COLLATE utf8mb4_unicode_ci = CAST(up.employee_id AS CHAR) COLLATE utf8mb4_unicode_ci
           WHERE up.user_id = ? AND e.emp_code = ?`,
          [userId, empCode]
        );
      }

      // If not found through user, try direct lookup
      if (!employees || employees.length === 0) {
        [employees] = await db.execute(
          'SELECT id, emp_code, name, face_embedding FROM employees WHERE emp_code = ?',
          [empCode]
        );
      }

      if (employees.length === 0) {
        return res.status(404).json({ error: `Employee with code "${empCode}" not found. Please complete onboarding first.` });
      }

      const employee = employees[0];

      // Validate embedding - this is the ORIGINAL face embedding from onboarding
      let storedEmbedding = employee.face_embedding;
      
      // Handle JSON string if needed
      if (typeof storedEmbedding === 'string') {
        try {
          storedEmbedding = JSON.parse(storedEmbedding);
        } catch (e) {
          console.error('Error parsing face_embedding JSON:', e);
          return res.status(500).json({ 
            error: 'Face embedding format error. Please re-register your face during onboarding.' 
          });
        }
      }
      
      if (!Array.isArray(storedEmbedding) || storedEmbedding.length === 0) {
        return res.status(500).json({ 
          error: 'Face embedding not found. Please complete onboarding and register your face first.' 
        });
      }

      // Verify face with Python service
      const verificationResult = await faceService.verifyFace(storedEmbedding, image);

      const confidence = verificationResult.confidence || 0;
      const distance = verificationResult.distance || 1.0;
      const match = verificationResult.match || false;
      
      // STRICT VERIFICATION CHECKS
      if (!match) {
        return res.status(401).json({
          error: 'Face verification failed. The face does not match the registered employee.',
          confidence: confidence,
          distance: distance
        });
      }

      const MIN_CONFIDENCE = 0.55;
      if (confidence < MIN_CONFIDENCE) {
        return res.status(401).json({
          error: 'Face verification failed. Confidence too low.',
          confidence: confidence,
          distance: distance
        });
      }

      const MAX_DISTANCE = 0.45;
      if (distance >= MAX_DISTANCE) {
        return res.status(401).json({
          error: 'Face verification failed. Face distance too high.',
          confidence: confidence,
          distance: distance
        });
      }

      console.log(`✅ Face verification PASSED for clock out ${empCode}: distance=${distance.toFixed(4)}, confidence=${(confidence * 100).toFixed(1)}%`);

      // Check last attendance to ensure user is clocked in
      const [lastAttendance] = await db.execute(
        'SELECT id, status, created_at, clock_in_time FROM attendance WHERE emp_id = ? ORDER BY created_at DESC LIMIT 1',
        [employee.id]
      );

      if (lastAttendance.length === 0 || lastAttendance[0].status !== 'IN') {
        return res.status(400).json({ error: 'You are not currently clocked in.' });
      }

      const clockIn = new Date(lastAttendance[0].created_at);
      const clockOut = new Date();
      const totalHours = (clockOut - clockIn) / (1000 * 60 * 60);
      const clockOutTime = moment(clockOut).format('HH:mm:ss');
      const clockInTime = lastAttendance[0].clock_in_time || moment(clockIn).format('HH:mm:ss');

      // Calculate late arrival, early departure, overtime, negative hours
      const now = moment();
      const expectedClockIn = moment(now.format('YYYY-MM-DD') + ' 09:00:00');
      const expectedClockOut = moment(now.format('YYYY-MM-DD') + ' 17:00:00');
      
      let lateArrival = 0;
      let earlyDeparture = 0;
      let overtimeHours = 0;
      let negativeHours = 0;

      const clockInMoment = moment(clockIn);
      if (clockInMoment.isAfter(expectedClockIn)) {
        lateArrival = moment.duration(clockInMoment.diff(expectedClockIn)).asMinutes();
      }

      if (now.isBefore(expectedClockOut)) {
        earlyDeparture = moment.duration(expectedClockOut.diff(now)).asMinutes();
      }

      const workDuration = moment.duration(now.diff(clockInMoment));
      const expectedWorkDuration = moment.duration(expectedClockOut.diff(expectedClockIn));

      if (workDuration.asHours() > expectedWorkDuration.asHours()) {
        overtimeHours = workDuration.asHours() - expectedWorkDuration.asHours();
      } else {
        negativeHours = expectedWorkDuration.asHours() - workDuration.asHours();
      }

      // Record clock out - only use columns that exist in the table
      await db.execute(
        'INSERT INTO attendance (emp_id, status, confidence, clock_in_time, clock_out_time, total_hours) VALUES (?, ?, ?, ?, ?, ?)',
        [employee.id, 'OUT', confidence, clockInTime, clockOutTime, totalHours]
      );

      console.log(`📝 Clock out recorded: ${employee.name} (${empCode})`);

      res.json({
        success: true,
        message: 'Clock out successful',
        employee: {
          id: employee.id,
          empCode: employee.emp_code,
          name: employee.name
        },
        status: 'OUT',
        confidence,
        clockInTime,
        clockOutTime,
        totalHours,
        lateArrival,
        earlyDeparture,
        overtimeHours,
        negativeHours
      });
    } catch (error) {
      console.error('Clock out error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  /**
   * Get attendance records
   */
  async getAttendance(req, res) {
    try {
      const { empCode, limit = 50 } = req.query;
      
      let query = `
        SELECT 
          a.id,
          a.emp_id,
          e.emp_code,
          e.name,
          a.status,
          a.confidence,
          a.created_at
        FROM attendance a
        JOIN employees e ON a.emp_id = e.id
      `;
      
      const params = [];
      if (empCode) {
        query += ' WHERE e.emp_code = ?';
        params.push(empCode);
      }
      
      // LIMIT must be a number, not a parameter placeholder in MySQL2
      const limitNum = Math.max(1, Math.min(1000, parseInt(limit) || 50));
      query += ` ORDER BY a.created_at DESC LIMIT ${limitNum}`;

      const [records] = await db.execute(query, params);
      res.json(records);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}

module.exports = new AttendanceController();
