const { Router }     = require('express');
const { randomUUID } = require('crypto');
const db             = require('../db/database');

const router = Router();

// GET /api/students
router.get('/', (req, res) => {
  const { role, studentId } = req.auth; // do authMiddleware

  // Se role = 'aluno', retorna só o aluno dele
  if (role === 'aluno' && !studentId) {
    return res.status(403).json({ error: 'Aluno sem student_id associado' });
  }

  let whereClause = '';
  let params = [];
  if (role === 'aluno') {
    whereClause = 'WHERE s.id = ?';
    params = [studentId];
  }

  const rows = db.prepare(`
    SELECT s.*,
      (SELECT json_object(
        'id', p.id, 'name', p.name,
        'start_date', p.start_date, 'end_date', p.end_date,
        'objective', p.objective
      )
      FROM training_periods p
      WHERE p.student_id = s.id AND p.is_active = 1
      ORDER BY p.start_date DESC LIMIT 1) AS active_period
    FROM students s
    ${whereClause}
    ORDER BY s.name COLLATE NOCASE
  `).all(...params);

  const students = rows.map(s => ({
    ...s,
    active_period: s.active_period ? JSON.parse(s.active_period) : null,
  }));

  res.json(students);
});

// POST /api/students
router.post('/', (req, res) => {
  const { name, email, phone, notes, avatar_color, photo } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Nome é obrigatório' });

  const id  = randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO students (id, name, email, phone, notes, avatar_color, photo, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name.trim(), email || null, phone || null, notes || null, avatar_color || '#6366f1', photo || null, now, now);

  res.status(201).json(db.prepare('SELECT * FROM students WHERE id = ?').get(id));
});

// GET /api/students/:id/history
router.get('/:id/history', (req, res) => {
  if (!db.prepare('SELECT id FROM students WHERE id = ?').get(req.params.id)) {
    return res.status(404).json({ error: 'Aluno não encontrado' });
  }

  const { workoutId, from, to } = req.query;
  const limit = Math.min(2000, Math.max(1, Number(req.query.limit || 500)));

  const conditions = ['l.student_id = ?'];
  const params     = [req.params.id];

  if (workoutId) { conditions.push('l.workout_id = ?');       params.push(workoutId); }
  if (from)      { conditions.push("l.created_at >= ?");      params.push(from); }
  if (to)        { conditions.push("l.created_at <= ?");      params.push(to + 'T23:59:59.999Z'); }

  params.push(limit);

  const rows = db.prepare(`
    SELECT l.*, w.name AS workout_name
    FROM workout_execution_logs l
    JOIN workouts w ON w.id = l.workout_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY l.created_at DESC
    LIMIT ?
  `).all(...params);

  res.json(rows);
});

// GET /api/students/:id
router.get('/:id', (req, res) => {
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
  if (!student) return res.status(404).json({ error: 'Aluno não encontrado' });

  student.periods = db.prepare(
    'SELECT * FROM training_periods WHERE student_id = ? ORDER BY start_date DESC'
  ).all(req.params.id);

  res.json(student);
});

// PUT /api/students/:id
router.put('/:id', (req, res) => {
  const { name, email, phone, notes, avatar_color, photo } = req.body;
  if (!db.prepare('SELECT id FROM students WHERE id = ?').get(req.params.id)) {
    return res.status(404).json({ error: 'Aluno não encontrado' });
  }
  if (!name?.trim()) return res.status(400).json({ error: 'Nome é obrigatório' });

  db.prepare(`
    UPDATE students SET name=?, email=?, phone=?, notes=?, avatar_color=?, photo=?, updated_at=?
    WHERE id=?
  `).run(name.trim(), email || null, phone || null, notes || null, avatar_color || '#6366f1', photo ?? undefined, new Date().toISOString(), req.params.id);

  res.json(db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id));
});

// DELETE /api/students/:id
router.delete('/:id', (req, res) => {
  if (!db.prepare('SELECT id FROM students WHERE id = ?').get(req.params.id)) {
    return res.status(404).json({ error: 'Aluno não encontrado' });
  }
  db.prepare('DELETE FROM students WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

module.exports = router;
