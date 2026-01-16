const db = require('../db');

class TasksController {
  async createTask(req, res) {
    try {
      const { title, description, due_date, priority } = req.body;
      const userId = req.user.userId;

      if (!title) {
        return res.status(400).json({ success: false, error: 'Title is required' });
      }

      const [result] = await db.execute(
        'INSERT INTO tasks (user_id, title, description, due_date, priority) VALUES (?, ?, ?, ?, ?)',
        [userId, title, description || null, due_date || null, priority || 'medium']
      );

      const [task] = await db.execute('SELECT * FROM tasks WHERE id = ?', [result.insertId]);

      res.json({ success: true, data: task[0] });
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  async getTasks(req, res) {
    try {
      const userId = req.user.userId;
      const status = req.query.status;

      let query = 'SELECT * FROM tasks WHERE user_id = ?';
      const params = [userId];

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }

      query += ' ORDER BY due_date ASC, created_at DESC';

      const [tasks] = await db.execute(query, params);

      res.json({ success: true, data: tasks || [] });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  async updateTask(req, res) {
    try {
      const { id } = req.params;
      const { title, description, due_date, status, priority } = req.body;
      const userId = req.user.userId;

      // Verify task belongs to user
      const [existing] = await db.execute('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [id, userId]);
      if (existing.length === 0) {
        return res.status(404).json({ success: false, error: 'Task not found' });
      }

      const updates = [];
      const values = [];

      if (title !== undefined) { updates.push('title = ?'); values.push(title); }
      if (description !== undefined) { updates.push('description = ?'); values.push(description); }
      if (due_date !== undefined) { updates.push('due_date = ?'); values.push(due_date); }
      if (status !== undefined) { updates.push('status = ?'); values.push(status); }
      if (priority !== undefined) { updates.push('priority = ?'); values.push(priority); }

      if (updates.length === 0) {
        return res.json({ success: true, data: existing[0] });
      }

      values.push(id, userId);
      await db.execute(
        `UPDATE tasks SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ? AND user_id = ?`,
        values
      );

      const [task] = await db.execute('SELECT * FROM tasks WHERE id = ?', [id]);

      res.json({ success: true, data: task[0] });
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  async deleteTask(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const [result] = await db.execute('DELETE FROM tasks WHERE id = ? AND user_id = ?', [id, userId]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, error: 'Task not found' });
      }

      res.json({ success: true, message: 'Task deleted successfully' });
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }
}

module.exports = new TasksController();
