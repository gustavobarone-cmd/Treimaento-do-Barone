const { Router } = require('express');
const { randomUUID } = require('crypto');
const db = require('../db/database');

const router = Router({ mergeParams: true });

function ensureStudent(studentId) {
  return db.prepare('SELECT id FROM students WHERE id = ?').get(studentId);
}

function ensurePeriodForStudent(periodId, studentId) {
  if (!periodId) return true;
  return db.prepare('SELECT id FROM training_periods WHERE id = ? AND student_id = ?').get(periodId, studentId);
}

function listBlocks(workoutId) {
  const blocks = db.prepare(`
    SELECT *
    FROM workout_blocks
    WHERE workout_id = ?
    ORDER BY sort_order ASC, created_at ASC
  `).all(workoutId);

  const itemsByBlock = db.prepare(`
    SELECT *
    FROM workout_block_items
    WHERE block_id IN (
      SELECT id FROM workout_blocks WHERE workout_id = ?
    )
    ORDER BY sort_order ASC, created_at ASC
  `).all(workoutId);

  const grouped = new Map();
  for (const item of itemsByBlock) {
    if (!grouped.has(item.block_id)) grouped.set(item.block_id, []);
    grouped.get(item.block_id).push(item);
  }

  return blocks.map((b) => ({ ...b, items: grouped.get(b.id) || [] }));
}

const replaceBlocks = db.transaction((workoutId, blocks = []) => {
  db.prepare(`
    DELETE FROM workout_block_items
    WHERE block_id IN (SELECT id FROM workout_blocks WHERE workout_id = ?)
  `).run(workoutId);
  db.prepare('DELETE FROM workout_blocks WHERE workout_id = ?').run(workoutId);

  const now = new Date().toISOString();
  const insertBlock = db.prepare(`
    INSERT INTO workout_blocks (
      id, workout_id, name, type, rest_between_exercises_sec, sort_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertItem = db.prepare(`
    INSERT INTO workout_block_items (
      id, block_id, exercise_name, prescription_mode, sets, reps, seconds,
      load_kg, youtube_url, rest_after_sec, sort_order, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  blocks.forEach((block, blockIdx) => {
    const blockId = randomUUID();
    insertBlock.run(
      blockId,
      workoutId,
      String(block.name || `Bloco ${blockIdx + 1}`).trim(),
      ['simples', 'biset', 'triset', 'circuito'].includes(block.type) ? block.type : 'simples',
      Number(block.rest_between_exercises_sec || 0),
      blockIdx,
      now,
      now
    );

    const items = Array.isArray(block.items) ? block.items : [];
    items.forEach((item, itemIdx) => {
      insertItem.run(
        randomUUID(),
        blockId,
        String(item.exercise_name || `Exercício ${itemIdx + 1}`).trim(),
        item.prescription_mode === 'tempo' ? 'tempo' : 'series',
        item.sets != null && item.sets !== '' ? Number(item.sets) : null,
        item.reps != null && item.reps !== '' ? Number(item.reps) : null,
        item.seconds != null && item.seconds !== '' ? Number(item.seconds) : null,
        item.load_kg != null && item.load_kg !== '' ? Number(item.load_kg) : null,
        item.youtube_url || null,
        Number(item.rest_after_sec || 0),
        itemIdx,
        item.notes || null,
        now,
        now
      );
    });
  });
});

router.get('/', (req, res) => {
  if (!ensureStudent(req.params.studentId)) {
    return res.status(404).json({ error: 'Aluno não encontrado' });
  }

  const workouts = db.prepare(`
    SELECT w.*, p.name AS period_name
    FROM workouts w
    LEFT JOIN training_periods p ON p.id = w.training_period_id
    WHERE w.student_id = ?
    ORDER BY w.created_at DESC
  `).all(req.params.studentId);

  res.json(workouts);
});

router.post('/', (req, res) => {
  const {
    name,
    mode = 'series',
    notes,
    training_period_id,
    pre_mobility_sec = 0,
    post_stretch_sec = 0,
    blocks = [],
  } = req.body;

  if (!ensureStudent(req.params.studentId)) {
    return res.status(404).json({ error: 'Aluno não encontrado' });
  }
  if (!name?.trim()) {
    return res.status(400).json({ error: 'Nome do treino é obrigatório' });
  }
  if (!['series', 'tempo'].includes(mode)) {
    return res.status(400).json({ error: 'Modo inválido. Use series ou tempo.' });
  }
  if (!ensurePeriodForStudent(training_period_id, req.params.studentId)) {
    return res.status(400).json({ error: 'Período inválido para este aluno' });
  }

  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO workouts (
      id, student_id, training_period_id, name, mode,
      pre_mobility_sec, post_stretch_sec, notes, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    req.params.studentId,
    training_period_id || null,
    name.trim(),
    mode,
    Number(pre_mobility_sec || 0),
    Number(post_stretch_sec || 0),
    notes || null,
    now,
    now
  );

  replaceBlocks(id, Array.isArray(blocks) ? blocks : []);

  const created = db.prepare('SELECT * FROM workouts WHERE id = ?').get(id);
  res.status(201).json({ ...created, blocks: listBlocks(id) });
});

router.get('/:workoutId', (req, res) => {
  const workout = db.prepare(
    'SELECT * FROM workouts WHERE id = ? AND student_id = ?'
  ).get(req.params.workoutId, req.params.studentId);

  if (!workout) {
    return res.status(404).json({ error: 'Treino não encontrado' });
  }

  res.json({ ...workout, blocks: listBlocks(workout.id) });
});

router.put('/:workoutId', (req, res) => {
  const {
    name,
    mode,
    notes,
    training_period_id,
    pre_mobility_sec = 0,
    post_stretch_sec = 0,
    blocks = [],
  } = req.body;

  const exists = db.prepare(
    'SELECT id FROM workouts WHERE id = ? AND student_id = ?'
  ).get(req.params.workoutId, req.params.studentId);

  if (!exists) {
    return res.status(404).json({ error: 'Treino não encontrado' });
  }
  if (!name?.trim()) {
    return res.status(400).json({ error: 'Nome do treino é obrigatório' });
  }
  if (!['series', 'tempo'].includes(mode)) {
    return res.status(400).json({ error: 'Modo inválido. Use series ou tempo.' });
  }
  if (!ensurePeriodForStudent(training_period_id, req.params.studentId)) {
    return res.status(400).json({ error: 'Período inválido para este aluno' });
  }

  db.prepare(`
    UPDATE workouts
    SET name = ?, mode = ?, notes = ?, training_period_id = ?,
        pre_mobility_sec = ?, post_stretch_sec = ?, updated_at = ?
    WHERE id = ? AND student_id = ?
  `).run(
    name.trim(),
    mode,
    notes || null,
    training_period_id || null,
    Number(pre_mobility_sec || 0),
    Number(post_stretch_sec || 0),
    new Date().toISOString(),
    req.params.workoutId,
    req.params.studentId
  );

  replaceBlocks(req.params.workoutId, Array.isArray(blocks) ? blocks : []);

  const updated = db.prepare(
    'SELECT * FROM workouts WHERE id = ? AND student_id = ?'
  ).get(req.params.workoutId, req.params.studentId);
  res.json({ ...updated, blocks: listBlocks(req.params.workoutId) });
});

router.delete('/:workoutId', (req, res) => {
  const exists = db.prepare(
    'SELECT id FROM workouts WHERE id = ? AND student_id = ?'
  ).get(req.params.workoutId, req.params.studentId);

  if (!exists) {
    return res.status(404).json({ error: 'Treino não encontrado' });
  }

  db.prepare('DELETE FROM workouts WHERE id = ? AND student_id = ?').run(req.params.workoutId, req.params.studentId);
  res.status(204).end();
});

router.get('/:workoutId/logs', (req, res) => {
  const exists = db.prepare(
    'SELECT id FROM workouts WHERE id = ? AND student_id = ?'
  ).get(req.params.workoutId, req.params.studentId);

  if (!exists) {
    return res.status(404).json({ error: 'Treino não encontrado' });
  }

  const logs = db.prepare(`
    SELECT *
    FROM workout_execution_logs
    WHERE student_id = ? AND workout_id = ?
    ORDER BY created_at DESC
  `).all(req.params.studentId, req.params.workoutId);

  res.json(logs);
});

router.post('/:workoutId/logs', (req, res) => {
  const exists = db.prepare(
    'SELECT id FROM workouts WHERE id = ? AND student_id = ?'
  ).get(req.params.workoutId, req.params.studentId);

  if (!exists) {
    return res.status(404).json({ error: 'Treino não encontrado' });
  }

  const entries = Array.isArray(req.body?.entries) ? req.body.entries : [];
  if (entries.length === 0) {
    return res.status(400).json({ error: 'Nenhum log para salvar' });
  }

  const insert = db.prepare(`
    INSERT INTO workout_execution_logs (
      id, student_id, workout_id, session_id, session_started_at, block_name, exercise_name, set_number,
      target_mode, target_reps, target_seconds, performed_reps,
      performed_load_kg, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();
  const tx = db.transaction((rows) => {
    for (const row of rows) {
      if (!row?.exercise_name || !row?.block_name) continue;
      insert.run(
        randomUUID(),
        req.params.studentId,
        req.params.workoutId,
        row.session_id || null,
        row.session_started_at || null,
        String(row.block_name),
        String(row.exercise_name),
        Number(row.set_number || 1),
        row.target_mode === 'tempo' ? 'tempo' : 'series',
        row.target_reps != null ? Number(row.target_reps) : null,
        row.target_seconds != null ? Number(row.target_seconds) : null,
        row.performed_reps != null && row.performed_reps !== '' ? Number(row.performed_reps) : null,
        row.performed_load_kg != null && row.performed_load_kg !== '' ? Number(row.performed_load_kg) : null,
        row.notes || null,
        now
      );
    }
  });

  tx(entries);
  res.status(201).json({ success: true, count: entries.length });
});

module.exports = router;
