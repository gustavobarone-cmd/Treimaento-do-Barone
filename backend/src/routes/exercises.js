const { Router } = require('express');
const { randomUUID } = require('crypto');
const db = require('../db/database');

const router = Router();

// GET /api/exercises — listar (filtro por muscle_group, search por nome)
router.get('/', (req, res) => {
  const { muscleGroup, q } = req.query;
  let whereClause = 'WHERE (is_public = 1 OR personal_id = ?)';
  let params = [req.auth.userId];

  if (muscleGroup) {
    whereClause += ' AND muscle_group = ?';
    params.push(muscleGroup);
  }

  if (q) {
    whereClause += ' AND name LIKE ?';
    params.push(`%${q}%`);
  }

  const exercises = db.prepare(`
    SELECT * FROM exercises
    ${whereClause}
    ORDER BY name COLLATE NOCASE
  `).all(...params);

  res.json(exercises);
});

// GET /api/exercises/:id
router.get('/:id', (req, res) => {
  const ex = db.prepare('SELECT * FROM exercises WHERE id = ?').get(req.params.id);
  if (!ex) return res.status(404).json({ error: 'Exercício não encontrado' });
  if (!ex.is_public && ex.personal_id !== req.auth.userId) {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  res.json(ex);
});

// POST /api/exercises — criar exercício (personal only)
router.post('/', (req, res) => {
  if (req.auth.role !== 'personal') {
    return res.status(403).json({ error: 'Apenas personals podem criar exercícios' });
  }

  const { name, muscleGroup, defaultDurationS, youtubeId, isPublic } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Nome obrigatório' });

  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO exercises (id, name, muscle_group, default_duration_s, youtube_id, personal_id, is_public, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    name.trim(),
    muscleGroup || null,
    defaultDurationS || 30,
    youtubeId || null,
    req.auth.userId,
    isPublic ? 1 : 0,
    now,
    now
  );

  res.status(201).json(db.prepare('SELECT * FROM exercises WHERE id = ?').get(id));
});

// PUT /api/exercises/:id — editar (apenas creator)
router.put('/:id', (req, res) => {
  const ex = db.prepare('SELECT * FROM exercises WHERE id = ?').get(req.params.id);
  if (!ex) return res.status(404).json({ error: 'Exercício não encontrado' });
  if (ex.personal_id !== req.auth.userId) {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const { name, muscleGroup, defaultDurationS, youtubeId, isPublic } = req.body;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE exercises SET name=?, muscle_group=?, default_duration_s=?, youtube_id=?, is_public=?, updated_at=?
    WHERE id=?
  `).run(
    name ?? ex.name,
    muscleGroup ?? ex.muscle_group,
    defaultDurationS ?? ex.default_duration_s,
    youtubeId ?? ex.youtube_id,
    isPublic !== undefined ? (isPublic ? 1 : 0) : ex.is_public,
    now,
    req.params.id
  );

  res.json(db.prepare('SELECT * FROM exercises WHERE id = ?').get(req.params.id));
});

// DELETE /api/exercises/:id
router.delete('/:id', (req, res) => {
  const ex = db.prepare('SELECT * FROM exercises WHERE id = ?').get(req.params.id);
  if (!ex) return res.status(404).json({ error: 'Exercício não encontrado' });
  if (ex.personal_id !== req.auth.userId) {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  db.prepare('DELETE FROM exercises WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

module.exports = router;
