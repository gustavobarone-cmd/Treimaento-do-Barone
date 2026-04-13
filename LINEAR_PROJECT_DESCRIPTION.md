# Personal Trainer App - Project Description

## Overview

**Personal Trainer App** é uma aplicação web progressiva (PWA) para gerenciamento de treinamentos físicos. Permite que personal trainers criem e gerenciem planos de treino para seus alunos, com suporte a mobilidade/alongamento integrados e acompanhamento de execução em tempo real.

**Status:** Phase 3 (Authentication & Dashboard) - ✅ Complete  
**Tech Stack:** React 18 + Vite, Node.js/Express, SQLite, JWT Auth  
**Live URL:** [GitHub Pages Link - To be set up]

---

## Key Features

### For Personal Trainers 👨‍🏫

1. **Student Management**
   - Cadastro de alunos com foto/avatar
   - Organização por períodos de treinamento
   - Visualização de histórico de treinos

2. **Workout Creation**
   - Criar treinos estruturados com blocos de exercícios
   - Modos: Séries+Repetições ou Tempo de Execução
   - Drag-and-drop para reorganizar blocos
   - Tempo estimado em tempo real

3. **Exercise Bank**
   - Banco de exercícios com vídeos YouTube
   - Filtro por grupo muscular
   - Criar exercícios públicos ou privados
   - Reutilizar exercícios entre alunos

4. **Mobilidade Integration**
   - Alongamentos pré-treino personalizados
   - Alongamentos pós-treino
   - Banco de 146+ alongamentos integrado
   - Tempo total do treino + pré + pós

5. **Dashboard & Analytics**
   - Visão geral: total de alunos, ativos, treinos
   - Atividade recente
   - (Phase 3c) Gráficos de progresso

### For Students/Athletes 🏋️

1. **Workout Execution**
   - Interface guiada: Pré-treino → Blocos → Pós-treino
   - Vídeo do exercício em loop durante execução
   - Timer automático ou modo "Séries Concluídas"
   - Beep/voz para avisos
   - Registro de carga realizada

2. **Workout History**
   - Log automático de cada treino executado
   - Visualização de histórico pessoal
   - (Phase 3c) Seu próprio dashboard com progresso

3. **PWA Benefits**
   - Funciona offline
   - Instável como app nativo (Add to Home Screen)
   - Sincronização de dados automática

---

## Architecture

### Frontend
- **Framework:** React 18
- **Build:** Vite 5
- **Routing:** React Router v6
- **State:** Context API + Custom Hooks
- **Styling:** CSS (custom, dark mode compatible)
- **Auth:** JWT tokens + localStorage

### Backend
- **Runtime:** Node.js
- **Framework:** Express
- **Database:** SQLite (WAL mode for concurrency)
- **Auth:** JWT (7-day expiry) + bcrypt (password hashing)
- **CORS:** Configured for localhost:5173

### Deployment
- **Frontend:** GitHub Pages (or Vercel)
- **Backend:** Node.js server (or serverless function)
- **Database:** SQLite file-based (or cloud database)

---

## Data Model

### Users
```
id (UUID)
email (unique)
password_hash (bcrypt)
role (personal | aluno)
student_id (optional FK)
created_at, updated_at
```

### Students
```
id (UUID)
personal_id (FK to users.id)
name, avatar_url, notes
created_at, updated_at
```

### Periods
```
id (UUID)
student_id (FK)
name, goal, start_date, end_date
created_at, updated_at
```

### Workouts
```
id (UUID)
student_id, period_id (FKs)
name, notes, estimated_duration_s
blocks (JSON: array of exercise blocks)
created_at, updated_at
```

### Exercises
```
id (UUID)
personal_id (FK)
name, muscle_group, youtube_id
default_duration_s, is_public
created_at, updated_at
```

### Workout Logs
```
id (UUID)
workout_id (FK)
completed_at, duration_s
exercises_completed (JSON log)
notes
```

---

## API Endpoints (Phase 3)

### Authentication
```
POST /api/auth/register
POST /api/auth/login
```

### Exercises (Exercise Bank)
```
GET    /api/exercises              (list with filters)
GET    /api/exercises/:id          (single)
POST   /api/exercises              (create - personal only)
PUT    /api/exercises/:id          (update - owner only)
DELETE /api/exercises/:id          (delete - owner only)
```

### Students (Existing - Phase 1)
```
GET    /api/students
GET    /api/students/:id
POST   /api/students
PUT    /api/students/:id
DELETE /api/students/:id
```

### Periods, Workouts, Mobility, etc.
(See backend code for full API reference)

---

## Development Phases

### ✅ Phase 1: Core MVP
- Student management
- Workout creation (blocks, exercises)
- Workout execution
- PWA setup

### ✅ Phase 2: UI Redesign
- Complete UI/UX overhaul
- Dark mode
- Photo upload
- Responsive design

### ✅ Phase 3: Authentication & Dashboard
- JWT authentication
- Role-based access (personal vs student)
- Exercise bank (CRUD)
- Dashboard with stats

### ⏳ Phase 3c: Analytics & Polish
- Advanced analytics dashboard
- JWT refresh tokens
- Mobile optimization
- Offline sync improvements

### ⏳ Phase 4: Production & Deployment
- Production database setup
- Security hardening
- Performance optimization
- Monitoring & logging

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/gustavobarone-cmd/Treimaento-do-Barone.git
cd Treimaento-do-Barone

# Backend setup
cd backend
npm install
npm run dev
# Runs on http://localhost:3001

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

### First Time Setup

1. **Create Test Account:**
   ```bash
   # Via API
   curl -X POST http://localhost:3001/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"senha123","role":"personal"}'
   ```

2. **Login:**
   - Go to http://localhost:5173
   - Use email and password from above
   - Redirected to /dashboard

3. **Create Exercise:**
   - Go to /exercises/new
   - Fill in: Name, Muscle Group, YouTube ID, Duration
   - Click "Salvar"

---

## Testing

### Unit Tests
(To be implemented in Phase 3c)

### E2E Tests
All features tested manually:
- ✅ Authentication (login, register)
- ✅ Exercise CRUD (create, read, update, delete)
- ✅ Filtering (muscle_group search)
- ✅ Role-based access
- ✅ Frontend components render

### Test Account
```
Email: personal@test.local
Password: senha123
Role: personal
```

---

## Deployment

### Frontend (GitHub Pages)
1. Push to GitHub
2. Go to Settings → Pages
3. Select `main` branch, `/root` folder
4. Site published at https://gustavobarone-cmd.github.io/Treimaento-do-Barone

### Backend (Node.js server)
Option 1: Self-hosted
```bash
cd backend
npm install --production
node server.js
```

Option 2: Heroku
```bash
# Set up Procfile and environment variables
git push heroku main
```

Option 3: Serverless (Firebase, AWS Lambda, etc.)
- Adapt server.js to handler function
- Set up database (Firebase Realtime DB, AWS RDS, etc.)

---

## Environment Variables

### Backend (.env)
```
DATABASE_URL=data/trainer.db
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRY=7d
NODE_ENV=development
PORT=3001
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001
```

---

## Contributing

1. Create a new branch: `git checkout -b feature/TRE-XXX-description`
2. Make changes and commit: `git commit -m "feat: Description"`
3. Push: `git push origin feature/TRE-XXX-description`
4. Open Pull Request
5. Link to Linear issue

---

## Performance Benchmarks (Current)

| Metric | Target | Actual |
|--------|--------|--------|
| Initial Load | < 3s | ~2s (dev) |
| Login | < 1s | ~0.3s |
| List Exercises | < 1s | ~0.2s |
| Create Exercise | < 2s | ~0.5s |
| Vite Dev Build | < 500ms | ~405ms |

---

## Known Issues & Limitations

### Current (Phase 3)
- JWT expiry fixed at 7 days (no refresh tokens)
- SQLite single-file (not suitable for multi-region deployment)
- No real-time collaboration (changes don't auto-sync between tabs)

### Production Before Deployment
- [ ] Add API rate limiting
- [ ] Implement request logging
- [ ] Set up error monitoring (Sentry)
- [ ] Configure HTTPS/SSL
- [ ] Add database backup strategy
- [ ] Implement analytics

---

## Support & Questions

- **GitHub Issues:** https://github.com/gustavobarone-cmd/Treimaento-do-Barone/issues
- **Linear Board:** [Insert Linear Link]
- **Documentation:** See README files in project root

---

## License

(Add license info here)

---

## Project Timeline

| Phase | Duration | Status | Highlights |
|-------|----------|--------|-----------|
| Phase 1 | 2 weeks | ✅ Complete | Core MVP |
| Phase 2 | 2 weeks | ✅ Complete | UI Redesign |
| Phase 3 | 1 week | ✅ Complete | Auth + Dashboard |
| Phase 3c | 1 week | ⏳ Planned | Analytics |
| Phase 4 | 2 weeks | ⏳ Planned | Production |

**Total Time to MVP:** ~5 weeks  
**Total Time to Production:** ~7-8 weeks

---

*Last Updated: 2026-04-13*  
*Next Review: After Phase 3c completion*

