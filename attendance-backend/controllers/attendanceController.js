const db = require('../db');
const faceService = require('../services/faceService');

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
        'SELECT status FROM attendance WHERE emp_id = ? ORDER BY created_at DESC LIMIT 1',
        [employee.id]
      );

      let status = 'IN';
      if (lastAttendance.length > 0 && lastAttendance[0].status === 'IN') {
        status = 'OUT';
      }

      // Record attendance
      await db.execute(
        'INSERT INTO attendance (emp_id, status, confidence) VALUES (?, ?, ?)',
        [employee.id, status, confidence]
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
