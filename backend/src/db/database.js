const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');

const DATA_DIR = path.join(__dirname, '../../../data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'personal_trainer.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function ensureColumn(table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  const hasColumn = cols.some((c) => c.name === column);
  if (!hasColumn) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id           TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    email        TEXT,
    phone        TEXT,
    avatar_color TEXT NOT NULL DEFAULT '#6366f1',
    notes        TEXT,
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL CHECK(role IN ('personal', 'aluno')),
    student_id    TEXT REFERENCES students(id) ON DELETE SET NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS training_periods (
    id         TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date   TEXT NOT NULL,
    objective  TEXT,
    is_active  INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS workouts (
    id                 TEXT PRIMARY KEY,
    student_id         TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    training_period_id TEXT REFERENCES training_periods(id) ON DELETE SET NULL,
    name               TEXT NOT NULL,
    mode               TEXT NOT NULL CHECK(mode IN ('series', 'tempo')),
    pre_mobility_sec   INTEGER NOT NULL DEFAULT 0,
    post_stretch_sec   INTEGER NOT NULL DEFAULT 0,
    notes              TEXT,
    created_at         TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at         TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS workout_blocks (
    id                         TEXT PRIMARY KEY,
    workout_id                 TEXT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    name                       TEXT NOT NULL,
    type                       TEXT NOT NULL CHECK(type IN ('simples', 'biset', 'triset', 'circuito')),
    rest_between_exercises_sec INTEGER NOT NULL DEFAULT 0,
    sort_order                 INTEGER NOT NULL DEFAULT 0,
    created_at                 TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at                 TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS workout_block_items (
    id                TEXT PRIMARY KEY,
    block_id          TEXT NOT NULL REFERENCES workout_blocks(id) ON DELETE CASCADE,
    exercise_name     TEXT NOT NULL,
    prescription_mode TEXT NOT NULL CHECK(prescription_mode IN ('series', 'tempo')),
    sets              INTEGER,
    reps              INTEGER,
    seconds           INTEGER,
    load_kg           REAL,
    youtube_url       TEXT,
    rest_after_sec    INTEGER NOT NULL DEFAULT 0,
    sort_order        INTEGER NOT NULL DEFAULT 0,
    notes             TEXT,
    created_at        TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS workout_mobility_items (
    id               TEXT PRIMARY KEY,
    workout_id       TEXT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    phase            TEXT NOT NULL CHECK(phase IN ('pre', 'post')),
    bank_item_id     TEXT NOT NULL,
    name_pt          TEXT NOT NULL,
    region           TEXT,
    default_duration_s INTEGER NOT NULL DEFAULT 30,
    cue              TEXT,
    youtube_id       TEXT,
    sort_order       INTEGER NOT NULL DEFAULT 0,
    created_at       TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS workout_execution_logs (
    id              TEXT PRIMARY KEY,
    student_id      TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    workout_id      TEXT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    session_id      TEXT,
    session_started_at TEXT,
    block_name      TEXT NOT NULL,
    exercise_name   TEXT NOT NULL,
    set_number      INTEGER NOT NULL,
    target_mode     TEXT NOT NULL CHECK(target_mode IN ('series', 'tempo')),
    target_reps     INTEGER,
    target_seconds  INTEGER,
    performed_reps  INTEGER,
    performed_load_kg REAL,
    notes           TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS exercises (
    id                    TEXT PRIMARY KEY,
    name                  TEXT NOT NULL,
    muscle_group          TEXT,
    default_duration_s    INTEGER NOT NULL DEFAULT 30,
    youtube_id            TEXT,
    personal_id           TEXT REFERENCES users(id) ON DELETE CASCADE,
    is_public             INTEGER NOT NULL DEFAULT 1,
    created_at            TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at            TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Migra bancos já existentes sem recriar tabela
ensureColumn('workouts', 'pre_mobility_sec', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('workouts', 'post_stretch_sec', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('workout_block_items', 'youtube_url', 'TEXT');
ensureColumn('workout_execution_logs', 'session_id', 'TEXT');
ensureColumn('workout_execution_logs', 'session_started_at', 'TEXT');
ensureColumn('students', 'photo', 'TEXT');

module.exports = db;
