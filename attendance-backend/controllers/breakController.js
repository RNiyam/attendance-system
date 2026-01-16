const db = require('../db');
const moment = require('moment');

class BreakController {
  async startBreak(req, res) {
    try {
      const userId = req.user.userId;
      const today = moment().format('YYYY-MM-DD');

      // Get today's attendance record
      const [attendance] = await db.execute(`
        SELECT a.id FROM attendance a
        JOIN employees e ON a.emp_id = e.id
        WHERE e.user_id = ? AND DATE(a.created_at) = ? AND a.status = 'IN'
        ORDER BY a.created_at DESC
        LIMIT 1
      `, [userId, today]);

      if (attendance.length === 0) {
        return res.status(400).json({ success: false, error: 'You must clock in first before starting a break' });
      }

      // Check if there's an active break
      const [activeBreak] = await db.execute(`
        SELECT * FROM break_times
        WHERE attendance_id = ? AND break_end IS NULL
        ORDER BY break_start DESC
        LIMIT 1
      `, [attendance[0].id]);

      if (activeBreak.length > 0) {
        return res.status(400).json({ success: false, error: 'You already have an active break' });
      }

      const [result] = await db.execute(
        'INSERT INTO break_times (attendance_id, break_start) VALUES (?, NOW())',
        [attendance[0].id]
      );

      const [breakRecord] = await db.execute('SELECT * FROM break_times WHERE id = ?', [result.insertId]);

      res.json({ success: true, data: breakRecord[0] });
    } catch (error) {
      console.error('Error starting break:', error);
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  async endBreak(req, res) {
    try {
      const userId = req.user.userId;
      const today = moment().format('YYYY-MM-DD');

      // Get today's attendance record
      const [attendance] = await db.execute(`
        SELECT a.id FROM attendance a
        JOIN employees e ON a.emp_id = e.id
        WHERE e.user_id = ? AND DATE(a.created_at) = ? AND a.status = 'IN'
        ORDER BY a.created_at DESC
        LIMIT 1
      `, [userId, today]);

      if (attendance.length === 0) {
        return res.status(400).json({ success: false, error: 'No active attendance found' });
      }

      // Get active break
      const [activeBreak] = await db.execute(`
        SELECT * FROM break_times
        WHERE attendance_id = ? AND break_end IS NULL
        ORDER BY break_start DESC
        LIMIT 1
      `, [attendance[0].id]);

      if (activeBreak.length === 0) {
        return res.status(400).json({ success: false, error: 'No active break found' });
      }

      const breakStart = moment(activeBreak[0].break_start);
      const breakEnd = moment();
      const breakDuration = moment.duration(breakEnd.diff(breakStart)).asMinutes();

      await db.execute(
        'UPDATE break_times SET break_end = NOW(), break_duration = ? WHERE id = ?',
        [breakDuration, activeBreak[0].id]
      );

      const [breakRecord] = await db.execute('SELECT * FROM break_times WHERE id = ?', [activeBreak[0].id]);

      res.json({ success: true, data: breakRecord[0] });
    } catch (error) {
      console.error('Error ending break:', error);
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }
}

module.exports = new BreakController();
