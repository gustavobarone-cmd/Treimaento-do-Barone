const express = require('express');
const cors = require('cors');

const authRouter      = require('./src/routes/auth');
const studentsRouter  = require('./src/routes/students');
const periodsRouter   = require('./src/routes/periods');
const workoutsRouter  = require('./src/routes/workouts');
const mobilityRouter  = require('./src/routes/mobility');
const exercisesRouter = require('./src/routes/exercises');
const { authMiddleware } = require('./src/middleware/auth');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

// Rotas públicas
app.use('/api/auth', authRouter);
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Middleware de autenticação para rotas protegidas
app.use(authMiddleware);

app.use('/api/students', studentsRouter);
app.use('/api/students/:studentId/periods', periodsRouter);
app.use('/api/students/:studentId/workouts', workoutsRouter);
app.use('/api/students/:studentId/workouts/:workoutId/mobility', mobilityRouter);
app.use('/api/mobility', mobilityRouter);
app.use('/api/exercises', exercisesRouter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});
