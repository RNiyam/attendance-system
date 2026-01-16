const db = require('../db');

class NotesController {
  async createNote(req, res) {
    try {
      const { title, content, is_pinned } = req.body;
      const userId = req.user.userId;

      if (!title || !content) {
        return res.status(400).json({ success: false, error: 'Title and content are required' });
      }

      const [result] = await db.execute(
        'INSERT INTO notes (user_id, title, content, is_pinned) VALUES (?, ?, ?, ?)',
        [userId, title, content, is_pinned || false]
      );

      const [note] = await db.execute('SELECT * FROM notes WHERE id = ?', [result.insertId]);

      res.json({ success: true, data: note[0] });
    } catch (error) {
      console.error('Error creating note:', error);
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  async getNotes(req, res) {
    try {
      const userId = req.user.userId;

      const [notes] = await db.execute(
        'SELECT * FROM notes WHERE user_id = ? ORDER BY is_pinned DESC, created_at DESC',
        [userId]
      );

      res.json({ success: true, data: notes || [] });
    } catch (error) {
      console.error('Error fetching notes:', error);
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  async updateNote(req, res) {
    try {
      const { id } = req.params;
      const { title, content, is_pinned } = req.body;
      const userId = req.user.userId;

      const [existing] = await db.execute('SELECT * FROM notes WHERE id = ? AND user_id = ?', [id, userId]);
      if (existing.length === 0) {
        return res.status(404).json({ success: false, error: 'Note not found' });
      }

      const updates = [];
      const values = [];

      if (title !== undefined) { updates.push('title = ?'); values.push(title); }
      if (content !== undefined) { updates.push('content = ?'); values.push(content); }
      if (is_pinned !== undefined) { updates.push('is_pinned = ?'); values.push(is_pinned); }

      if (updates.length === 0) {
        return res.json({ success: true, data: existing[0] });
      }

      values.push(id, userId);
      await db.execute(
        `UPDATE notes SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ? AND user_id = ?`,
        values
      );

      const [note] = await db.execute('SELECT * FROM notes WHERE id = ?', [id]);

      res.json({ success: true, data: note[0] });
    } catch (error) {
      console.error('Error updating note:', error);
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  async deleteNote(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const [result] = await db.execute('DELETE FROM notes WHERE id = ? AND user_id = ?', [id, userId]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, error: 'Note not found' });
      }

      res.json({ success: true, message: 'Note deleted successfully' });
    } catch (error) {
      console.error('Error deleting note:', error);
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }
}

module.exports = new NotesController();
