const db = require('../db');

class ScheduleController {
  async createEvent(req, res) {
    try {
      const { title, description, event_date, event_time, type } = req.body;
      const userId = req.user.userId;

      if (!title || !event_date) {
        return res.status(400).json({ success: false, error: 'Title and event date are required' });
      }

      const [result] = await db.execute(
        'INSERT INTO schedule (user_id, title, description, event_date, event_time, type) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, title, description || null, event_date, event_time || null, type || 'other']
      );

      const [event] = await db.execute('SELECT * FROM schedule WHERE id = ?', [result.insertId]);

      res.json({ success: true, data: event[0] });
    } catch (error) {
      console.error('Error creating event:', error);
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  async getEvents(req, res) {
    try {
      const userId = req.user.userId;
      const startDate = req.query.start_date;
      const endDate = req.query.end_date;

      let query = 'SELECT * FROM schedule WHERE user_id = ?';
      const params = [userId];

      if (startDate && endDate) {
        query += ' AND event_date >= ? AND event_date <= ?';
        params.push(startDate, endDate);
      } else if (startDate) {
        query += ' AND event_date >= ?';
        params.push(startDate);
      }

      query += ' ORDER BY event_date ASC, event_time ASC';

      const [events] = await db.execute(query, params);

      res.json({ success: true, data: events || [] });
    } catch (error) {
      console.error('Error fetching events:', error);
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  async updateEvent(req, res) {
    try {
      const { id } = req.params;
      const { title, description, event_date, event_time, type, status } = req.body;
      const userId = req.user.userId;

      const [existing] = await db.execute('SELECT * FROM schedule WHERE id = ? AND user_id = ?', [id, userId]);
      if (existing.length === 0) {
        return res.status(404).json({ success: false, error: 'Event not found' });
      }

      const updates = [];
      const values = [];

      if (title !== undefined) { updates.push('title = ?'); values.push(title); }
      if (description !== undefined) { updates.push('description = ?'); values.push(description); }
      if (event_date !== undefined) { updates.push('event_date = ?'); values.push(event_date); }
      if (event_time !== undefined) { updates.push('event_time = ?'); values.push(event_time); }
      if (type !== undefined) { updates.push('type = ?'); values.push(type); }
      if (status !== undefined) { updates.push('status = ?'); values.push(status); }

      if (updates.length === 0) {
        return res.json({ success: true, data: existing[0] });
      }

      values.push(id, userId);
      await db.execute(
        `UPDATE schedule SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ? AND user_id = ?`,
        values
      );

      const [event] = await db.execute('SELECT * FROM schedule WHERE id = ?', [id]);

      res.json({ success: true, data: event[0] });
    } catch (error) {
      console.error('Error updating event:', error);
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  async deleteEvent(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const [result] = await db.execute('DELETE FROM schedule WHERE id = ? AND user_id = ?', [id, userId]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, error: 'Event not found' });
      }

      res.json({ success: true, message: 'Event deleted successfully' });
    } catch (error) {
      console.error('Error deleting event:', error);
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }
}

module.exports = new ScheduleController();
