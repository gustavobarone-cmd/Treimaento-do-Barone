const { Router } = require('express');
const { randomUUID } = require('crypto');
const bcrypt = require('bcrypt');
const db = require('../db/database');
const { generateToken } = require('../middleware/auth');

const router = Router();

// POST /auth/login — email + password → JWT token
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email?.trim() || !password?.trim()) {
    return res.status(400).json({ error: 'Email e password obrigatórios' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Email ou password inválido' });
  }

  const validPassword = bcrypt.compareSync(password, user.password_hash);
  if (!validPassword) {
    return res.status(401).json({ error: 'Email ou password inválido' });
  }

  const token = generateToken(user);
  res.json({ token, user: { id: user.id, email: user.email, role: user.role, studentId: user.student_id } });
});

// POST /auth/register — criar novo usuário (apenas dev/admin por enquanto, sem endpoint público)
router.post('/register', (req, res) => {
  const { email, password, role, studentId } = req.body;
  if (!email?.trim() || !password?.trim() || !role?.trim()) {
    return res.status(400).json({ error: 'Email, password e role obrigatórios' });
  }
  if (!['personal', 'aluno'].includes(role)) {
    return res.status(400).json({ error: "Role deve ser 'personal' ou 'aluno'" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password deve ter ao menos 6 caracteres' });
  }

  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existingUser) {
    return res.status(409).json({ error: 'Email já cadastrado' });
  }

  const id = randomUUID();
  const passwordHash = bcrypt.hashSync(password, 10);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO users (id, email, password_hash, role, student_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, email.toLowerCase(), passwordHash, role, studentId || null, now, now);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  const token = generateToken(user);
  res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role, studentId: user.student_id } });
});

module.exports = router;
