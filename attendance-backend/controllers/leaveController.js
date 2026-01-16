const db = require('../db');
const moment = require('moment');

class LeaveController {
  async createLeaveRequest(req, res) {
    try {
      const { leave_type, start_date, end_date, reason } = req.body;
      const userId = req.user.userId;

      if (!start_date || !end_date) {
        return res.status(400).json({ success: false, error: 'Start date and end date are required' });
      }

      const start = moment(start_date);
      const end = moment(end_date);
      const daysCount = end.diff(start, 'days') + 1;

      if (daysCount <= 0) {
        return res.status(400).json({ success: false, error: 'End date must be after start date' });
      }

      const [result] = await db.execute(
        'INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, days_count, reason) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, leave_type || 'vacation', start_date, end_date, daysCount, reason || null]
      );

      const [leave] = await db.execute('SELECT * FROM leave_requests WHERE id = ?', [result.insertId]);

      res.json({ success: true, data: leave[0] });
    } catch (error) {
      console.error('Error creating leave request:', error);
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  async getLeaveRequests(req, res) {
    try {
      const userId = req.user.userId;
      const status = req.query.status;

      let query = 'SELECT * FROM leave_requests WHERE user_id = ?';
      const params = [userId];

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }

      query += ' ORDER BY created_at DESC';

      const [leaves] = await db.execute(query, params);

      res.json({ success: true, data: leaves || [] });
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  async approveLeaveRequest(req, res) {
    try {
      const { id } = req.params;
      const adminId = req.user.userId;

      // Check if user is admin
      const [user] = await db.execute('SELECT role FROM users WHERE id = ?', [adminId]);
      if (user[0]?.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Only admins can approve leave requests' });
      }

      const [result] = await db.execute(
        'UPDATE leave_requests SET status = ?, approved_by = ?, approved_at = NOW() WHERE id = ?',
        ['approved', adminId, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, error: 'Leave request not found' });
      }

      const [leave] = await db.execute('SELECT * FROM leave_requests WHERE id = ?', [id]);

      res.json({ success: true, data: leave[0] });
    } catch (error) {
      console.error('Error approving leave request:', error);
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  async rejectLeaveRequest(req, res) {
    try {
      const { id } = req.params;
      const adminId = req.user.userId;

      const [user] = await db.execute('SELECT role FROM users WHERE id = ?', [adminId]);
      if (user[0]?.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Only admins can reject leave requests' });
      }

      const [result] = await db.execute(
        'UPDATE leave_requests SET status = ?, approved_by = ?, approved_at = NOW() WHERE id = ?',
        ['rejected', adminId, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, error: 'Leave request not found' });
      }

      const [leave] = await db.execute('SELECT * FROM leave_requests WHERE id = ?', [id]);

      res.json({ success: true, data: leave[0] });
    } catch (error) {
      console.error('Error rejecting leave request:', error);
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }
}

module.exports = new LeaveController();
