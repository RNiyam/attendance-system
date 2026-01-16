const db = require('../db');
const moment = require('moment');

class DashboardController {
  /**
   * Get dashboard data for employee
   */
  async getEmployeeDashboard(req, res) {
    try {
      const userId = req.user.userId;
      const today = moment().format('YYYY-MM-DD');
      const currentWeek = moment().week();
      const currentYear = moment().year();

      // Get today's attendance - join through user_profiles to link user to employee
      const [todayAttendance] = await db.execute(`
        SELECT a.* FROM attendance a
        JOIN employees e ON a.emp_id = e.id
        JOIN user_profiles up ON CAST(e.emp_code AS CHAR) COLLATE utf8mb4_unicode_ci = CAST(up.employee_id AS CHAR) COLLATE utf8mb4_unicode_ci
        WHERE up.user_id = ? AND DATE(a.created_at) = ?
        ORDER BY a.created_at DESC
        LIMIT 1
      `, [userId, today]);

      // Get tasks with assigned by user name
      const [tasks] = await db.execute(`
        SELECT t.*, u.name as assigned_by_name
        FROM tasks t
        LEFT JOIN users u ON t.assigned_by = u.id
        WHERE t.user_id = ?
        ORDER BY t.due_date ASC, t.created_at DESC
        LIMIT 10
      `, [userId]);

      // Get schedule/events
      const [schedule] = await db.execute(`
        SELECT * FROM schedule
        WHERE user_id = ? AND event_date >= ?
        ORDER BY event_date ASC, event_time ASC
        LIMIT 10
      `, [userId, today]);

      // Get notes
      const [notes] = await db.execute(`
        SELECT * FROM notes
        WHERE user_id = ?
        ORDER BY is_pinned DESC, created_at DESC
        LIMIT 10
      `, [userId]);

      // Get attendance overview for current week
      const weekStart = moment().startOf('week').format('YYYY-MM-DD');
      const weekEnd = moment().endOf('week').format('YYYY-MM-DD');
      
      const [attendanceOverview] = await db.execute(`
        SELECT 
          DATE(a.created_at) as date,
          TIME(a.created_at) as time,
          a.status,
          a.is_late,
          DAYNAME(a.created_at) as day_name
        FROM attendance a
        JOIN employees e ON a.emp_id = e.id
        JOIN user_profiles up ON CAST(e.emp_code AS CHAR) COLLATE utf8mb4_unicode_ci = CAST(up.employee_id AS CHAR) COLLATE utf8mb4_unicode_ci
        WHERE up.user_id = ? 
          AND DATE(a.created_at) >= ? 
          AND DATE(a.created_at) <= ?
        ORDER BY a.created_at ASC
      `, [userId, weekStart, weekEnd]);

      // Get comprehensive attendance KPIs
      const [metrics] = await db.execute(`
        SELECT 
          COUNT(CASE WHEN a.status = 'IN' AND DATE(a.created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as total_attendance_days,
          COUNT(CASE WHEN a.is_late = TRUE AND DATE(a.created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as late_arrivals,
          COUNT(CASE WHEN a.is_late = FALSE AND a.status = 'IN' AND DATE(a.created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as on_time_arrivals,
          ROUND(COUNT(CASE WHEN a.is_late = FALSE AND a.status = 'IN' AND DATE(a.created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) * 100.0 / NULLIF(COUNT(CASE WHEN a.status = 'IN' AND DATE(a.created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END), 0), 2) as on_time_rate,
          ROUND(SUM(CASE WHEN a.total_hours IS NOT NULL AND DATE(a.created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN a.total_hours ELSE 0 END), 2) as total_hours_worked,
          ROUND(SUM(CASE WHEN a.total_hours > 8 AND DATE(a.created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN a.total_hours - 8 ELSE 0 END), 2) as overtime_hours,
          ROUND(AVG(CASE WHEN a.total_hours IS NOT NULL AND DATE(a.created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN a.total_hours ELSE NULL END), 2) as avg_hours_per_day,
          COUNT(CASE WHEN a.status = 'IN' AND DATE(a.created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as this_week_attendance,
          COUNT(CASE WHEN a.status = 'IN' AND DATE(a.created_at) >= DATE_SUB(CURDATE(), INTERVAL 1 DAY) THEN 1 END) as today_attendance
        FROM attendance a
        JOIN employees e ON a.emp_id = e.id
        JOIN user_profiles up ON CAST(e.emp_code AS CHAR) COLLATE utf8mb4_unicode_ci = CAST(up.employee_id AS CHAR) COLLATE utf8mb4_unicode_ci
        WHERE up.user_id = ?
      `, [userId]);

      // Get upcoming vacations
      const [vacations] = await db.execute(`
        SELECT * FROM leave_requests
        WHERE user_id = ? AND status = 'approved' AND start_date >= ?
        ORDER BY start_date ASC
        LIMIT 5
      `, [userId, today]);

      // Get break times for today
      const [breaks] = await db.execute(`
        SELECT bt.* FROM break_times bt
        JOIN attendance a ON bt.attendance_id = a.id
        JOIN employees e ON a.emp_id = e.id
        JOIN user_profiles up ON CAST(e.emp_code AS CHAR) COLLATE utf8mb4_unicode_ci = CAST(up.employee_id AS CHAR) COLLATE utf8mb4_unicode_ci
        WHERE up.user_id = ? AND DATE(bt.break_start) = ?
        ORDER BY bt.break_start DESC
      `, [userId, today]);

      // Calculate current time if clocked in
      let currentTime = null;
      if (todayAttendance && todayAttendance.length > 0 && todayAttendance[0].status === 'IN') {
        const clockIn = moment(todayAttendance[0].created_at);
        const now = moment();
        currentTime = moment.duration(now.diff(clockIn)).asHours();
      }

      res.json({
        success: true,
        data: {
          todayAttendance: todayAttendance[0] || null,
          breaks: breaks || [],
          currentTime: currentTime,
          kpis: {
            totalAttendanceDays: metrics[0]?.total_attendance_days || 0,
            lateArrivals: metrics[0]?.late_arrivals || 0,
            onTimeArrivals: metrics[0]?.on_time_arrivals || 0,
            onTimeRate: metrics[0]?.on_time_rate || 0,
            totalHoursWorked: metrics[0]?.total_hours_worked || 0,
            overtimeHours: metrics[0]?.overtime_hours || 0,
            avgHoursPerDay: metrics[0]?.avg_hours_per_day || 0,
            thisWeekAttendance: metrics[0]?.this_week_attendance || 0,
            todayAttendance: metrics[0]?.today_attendance || 0
          }
        }
      });
    } catch (error) {
      console.error('Error fetching employee dashboard:', error);
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  /**
   * Get dashboard data for admin
   */
  async getAdminDashboard(req, res) {
    try {
      const today = moment().format('YYYY-MM-DD');
      const currentWeek = moment().week();

      // Get pending leave requests
      const [pendingLeaves] = await db.execute(`
        SELECT lr.*, u.name as employee_name, u.email as employee_email
        FROM leave_requests lr
        JOIN users u ON lr.user_id = u.id
        WHERE lr.status = 'pending'
        ORDER BY lr.created_at DESC
        LIMIT 10
      `);

      // Get all employees
      const [employees] = await db.execute(`
        SELECT e.*, u.name, u.email, u.mobile_number
        FROM employees e
        LEFT JOIN users u ON e.user_id = u.id
        ORDER BY e.created_at DESC
      `);

      // Get attendance stats
      const [attendanceStats] = await db.execute(`
        SELECT 
          COUNT(DISTINCT e.id) as total_employees,
          COUNT(a.id) as total_records,
          COUNT(CASE WHEN a.status = 'IN' THEN 1 END) as checkins,
          COUNT(CASE WHEN a.status = 'OUT' THEN 1 END) as checkouts,
          COUNT(CASE WHEN a.is_late = TRUE THEN 1 END) as late_count
        FROM employees e
        LEFT JOIN attendance a ON e.id = a.emp_id AND DATE(a.created_at) = ?
      `, [today]);

      // Get recent attendance
      const [recentAttendance] = await db.execute(`
        SELECT a.*, e.name, e.emp_code
        FROM attendance a
        JOIN employees e ON a.emp_id = e.id
        ORDER BY a.created_at DESC
        LIMIT 20
      `);

      res.json({
        success: true,
        data: {
          pendingLeaves: pendingLeaves || [],
          employees: employees || [],
          stats: attendanceStats[0] || {},
          recentAttendance: recentAttendance || []
        }
      });
    } catch (error) {
      console.error('Error fetching admin dashboard:', error);
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  /**
   * Get calendar data
   */
  async getCalendar(req, res) {
    try {
      const userId = req.user?.userId;
      const month = req.query.month || moment().format('YYYY-MM');
      const startDate = moment(month).startOf('month').format('YYYY-MM-DD');
      const endDate = moment(month).endOf('month').format('YYYY-MM-DD');

      let calendarData = [];

      if (userId) {
        // Employee calendar - their attendance and events
        const [attendance] = await db.execute(`
          SELECT DATE(a.created_at) as date, a.status, a.is_late
          FROM attendance a
          JOIN employees e ON a.emp_id = e.id
          WHERE e.user_id = ? AND DATE(a.created_at) >= ? AND DATE(a.created_at) <= ?
        `, [userId, startDate, endDate]);

        const [events] = await db.execute(`
          SELECT event_date as date, title, type
          FROM schedule
          WHERE user_id = ? AND event_date >= ? AND event_date <= ?
        `, [userId, startDate, endDate]);

        calendarData = [...attendance, ...events];
      } else {
        // Admin calendar - all employees attendance
        const [attendance] = await db.execute(`
          SELECT DATE(a.created_at) as date, COUNT(*) as count
          FROM attendance a
          WHERE DATE(a.created_at) >= ? AND DATE(a.created_at) <= ?
          GROUP BY DATE(a.created_at)
        `, [startDate, endDate]);

        calendarData = attendance;
      }

      res.json({
        success: true,
        data: calendarData
      });
    } catch (error) {
      console.error('Error fetching calendar:', error);
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }
}

module.exports = new DashboardController();
