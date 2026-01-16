const db = require('../db');
const faceService = require('../services/faceService');

class EmployeeController {
  /**
   * Register a new employee with face recognition
   */
  async registerEmployee(req, res) {
    try {
      const { empCode, name, image } = req.body;

      if (!empCode || !name || !image) {
        return res.status(400).json({ error: 'empCode, name, and image are required' });
      }

      // Validate image format
      if (typeof image !== 'string' || !image.startsWith('data:image/')) {
        return res.status(400).json({ error: 'Invalid image format. Expected base64 data URL.' });
      }

      // Get face embedding from Python service
      console.log('\n📸 Employee Registration - Calling face service...');
      let embedding;
      try {
        embedding = await faceService.registerFace(image);
        console.log('✅ Face embedding received:', embedding ? `Array of ${embedding.length} values` : 'null');
      } catch (error) {
        console.error('❌ Face service error:', error.message);
        console.error('Error stack:', error.stack);
        return res.status(500).json({ 
          error: error.message || 'Failed to register face. Please ensure the Python face recognition service is running on port 8000.'
        });
      }
      
      if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
        return res.status(400).json({ error: 'Failed to extract face embedding. Please ensure exactly one face is visible in the image.' });
      }
      
      const embeddingJson = JSON.stringify(embedding);

      // Check if employee code already exists
      const [existing] = await db.execute(
        'SELECT id FROM employees WHERE emp_code = ?',
        [empCode]
      );

      if (existing.length > 0) {
        return res.status(409).json({ error: 'Employee code already exists' });
      }

      // Insert employee with face embedding
      const [result] = await db.execute(
        'INSERT INTO employees (emp_code, name, face_embedding) VALUES (?, ?, ?)',
        [empCode, name, embeddingJson]
      );

      console.log(`✅ Employee registered: ${name} (${empCode}), ID: ${result.insertId}`);

      res.json({
        success: true,
        message: 'Employee registered successfully',
        employeeId: result.insertId
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  /**
   * Get all employees
   */
  async getAllEmployees(req, res) {
    try {
      const [employees] = await db.execute(
        'SELECT id, emp_code, name, created_at FROM employees ORDER BY created_at DESC'
      );
      res.json(employees);
    } catch (error) {
      console.error('Error fetching employees:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  /**
   * Get employee by code
   */
  async getEmployeeByCode(req, res) {
    try {
      const { empCode } = req.params;
      
      const [employees] = await db.execute(
        'SELECT id, emp_code, name, created_at FROM employees WHERE emp_code = ?',
        [empCode]
      );

      if (employees.length === 0) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      res.json(employees[0]);
    } catch (error) {
      console.error('Error fetching employee:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}

module.exports = new EmployeeController();
