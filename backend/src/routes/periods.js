const { Router }     = require('express');
const { randomUUID } = require('crypto');
const db             = require('../db/database');

const router = Router({ mergeParams: true });

// GET /api/students/:studentId/periods
router.get('/', (req, res) => {
  res.json(
    db.prepare('SELECT * FROM training_periods WHERE student_id = ? ORDER BY start_date DESC')
      .all(req.params.studentId)
  );
});

// POST /api/students/:studentId/periods
router.post('/', (req, res) => {
  const { name, start_date, end_date, objective, is_active = true } = req.body;

  if (!db.prepare('SELECT id FROM students WHERE id = ?').get(req.params.studentId)) {
    return res.status(404).json({ error: 'Aluno não encontrado' });
  }
  if (!name?.trim())  return res.status(400).json({ error: 'Nome do período é obrigatório' });
  if (!start_date)    return res.status(400).json({ error: 'Data de início é obrigatória' });
  if (!end_date)      return res.status(400).json({ error: 'Data de fim é obrigatória' });

  if (is_active) {
    db.prepare('UPDATE training_periods SET is_active = 0 WHERE student_id = ?')
      .run(req.params.studentId);
  }

  const id  = randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO training_periods (id, student_id, name, start_date, end_date, objective, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.params.studentId, name.trim(), start_date, end_date, objective || null, is_active ? 1 : 0, now, now);

  res.status(201).json(db.prepare('SELECT * FROM training_periods WHERE id = ?').get(id));
});

// PUT /api/students/:studentId/periods/:id
router.put('/:id', (req, res) => {
  const { name, start_date, end_date, objective, is_active } = req.body;

  if (!db.prepare('SELECT id FROM training_periods WHERE id = ? AND student_id = ?').get(req.params.id, req.params.studentId)) {
    return res.status(404).json({ error: 'Período não encontrado' });
  }
  if (!name?.trim()) return res.status(400).json({ error: 'Nome do período é obrigatório' });

  if (is_active) {
    db.prepare('UPDATE training_periods SET is_active = 0 WHERE student_id = ?')
      .run(req.params.studentId);
  }

  db.prepare(`
    UPDATE training_periods SET name=?, start_date=?, end_date=?, objective=?, is_active=?, updated_at=?
    WHERE id=?
  `).run(name.trim(), start_date, end_date, objective || null, is_active ? 1 : 0, new Date().toISOString(), req.params.id);

  res.json(db.prepare('SELECT * FROM training_periods WHERE id = ?').get(req.params.id));
});

// DELETE /api/students/:studentId/periods/:id
router.delete('/:id', (req, res) => {
  if (!db.prepare('SELECT id FROM training_periods WHERE id = ? AND student_id = ?').get(req.params.id, req.params.studentId)) {
    return res.status(404).json({ error: 'Período não encontrado' });
  }
  db.prepare('DELETE FROM training_periods WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

module.exports = router;
