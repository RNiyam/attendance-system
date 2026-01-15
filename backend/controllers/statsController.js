const db = require('../db');

class StatsController {
  /**
   * Get attendance statistics
   */
  async getStats(req, res) {
    try {
      // Get total employees from employees table
      const [empCount] = await db.execute('SELECT COUNT(*) as count FROM employees');
      const totalEmployees = empCount[0]?.count || 0;
      
      // Get attendance stats
      const [attendanceStats] = await db.execute(`
        SELECT 
          COUNT(*) as total_records,
          COUNT(CASE WHEN status = 'IN' THEN 1 END) as total_checkins,
          COUNT(CASE WHEN status = 'OUT' THEN 1 END) as total_checkouts
        FROM attendance
      `);
      
      res.json({
        total_employees: totalEmployees,
        total_records: attendanceStats[0]?.total_records || 0,
        total_checkins: attendanceStats[0]?.total_checkins || 0,
        total_checkouts: attendanceStats[0]?.total_checkouts || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}

module.exports = new StatsController();
