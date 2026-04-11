/**
 * GET /api/mobility-bank?phase=pre|post|all
 *   Retorna itens do banco de alongamentos/mobilidade.
 *
 * GET  /api/students/:sid/workouts/:wid/mobility
 * PUT  /api/students/:sid/workouts/:wid/mobility
 *   Lê / substitui a lista de exercícios de pré/pós do treino.
 */
const { Router }     = require('express');
const { randomUUID } = require('crypto');
const path           = require('path');
const fs             = require('fs');
const db             = require('../db/database');

const router = Router({ mergeParams: true });

// ─── Carregar banco JSON uma vez ────────────────────────────────────────────
const BANK_PATH = path.join(__dirname, '../../../stretches_bank_v1.json');
let bankItems = [];
try {
  const raw = JSON.parse(fs.readFileSync(BANK_PATH, 'utf-8'));
  bankItems = Array.isArray(raw.items) ? raw.items : [];
} catch (e) {
  console.warn('mobility.js: não foi possível carregar stretches_bank_v1.json', e.message);
}

// GET /api/mobility-bank
router.get('/bank', (req, res) => {
  const phase = req.query.phase;
  const items = phase && phase !== 'all'
    ? bankItems.filter((i) => i.phase === phase)
    : bankItems;

  res.json(items.map((i) => ({
    id:                 i.id,
    name_pt:            i.name_pt,
    phase:              i.phase,
    style:              i.style,
    region:             i.region,
    level:              i.level,
    default_duration_s: i.default_duration_s,
    cue:                i.cue,
    youtube_id:         i.video?.youtubeId || null,
  })));
});

// GET /api/students/:sid/workouts/:wid/mobility
router.get('/', (req, res) => {
  const { studentId, workoutId } = req.params;
  const workout = db.prepare('SELECT id FROM workouts WHERE id = ? AND student_id = ?')
    .get(workoutId, studentId);
  if (!workout) return res.status(404).json({ error: 'Treino não encontrado' });

  const rows = db.prepare(`
    SELECT * FROM workout_mobility_items
    WHERE workout_id = ?
    ORDER BY phase ASC, sort_order ASC, created_at ASC
  `).all(workoutId);

  res.json(rows);
});

// PUT /api/students/:sid/workouts/:wid/mobility
// Body: { pre: [...items], post: [...items] }
// item: { bank_item_id, name_pt, region, default_duration_s, cue, youtube_id }
const replaceMobility = db.transaction((workoutId, pre = [], post = []) => {
  db.prepare('DELETE FROM workout_mobility_items WHERE workout_id = ?').run(workoutId);

  const now = new Date().toISOString();
  const ins = db.prepare(`
    INSERT INTO workout_mobility_items
      (id, workout_id, phase, bank_item_id, name_pt, region, default_duration_s, cue, youtube_id, sort_order, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const save = (items, phase) =>
    items.forEach((item, idx) => {
      ins.run(
        randomUUID(),
        workoutId,
        phase,
        String(item.bank_item_id || ''),
        String(item.name_pt || ''),
        item.region || null,
        Number(item.default_duration_s || 30),
        item.cue || null,
        item.youtube_id || null,
        idx,
        now,
      );
    });

  save(pre,  'pre');
  save(post, 'post');
});

router.put('/', (req, res) => {
  const { studentId, workoutId } = req.params;
  const workout = db.prepare('SELECT id FROM workouts WHERE id = ? AND student_id = ?')
    .get(workoutId, studentId);
  if (!workout) return res.status(404).json({ error: 'Treino não encontrado' });

  const { pre = [], post = [] } = req.body;
  replaceMobility(workoutId, Array.isArray(pre) ? pre : [], Array.isArray(post) ? post : []);

  const rows = db.prepare(`
    SELECT * FROM workout_mobility_items WHERE workout_id = ?
    ORDER BY phase ASC, sort_order ASC
  `).all(workoutId);

  res.json(rows);
});

module.exports = router;
