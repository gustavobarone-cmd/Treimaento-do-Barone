# Phase 3a — JWT Auth + Exercises CRUD

**Status:** ✅ Completo
**Commit:** d258d56
**Data:** 2026-04-13

## 📋 Issues Resolvidas

### Backend Authentication (TRE-87 épic)
- **TRE-88 - POST /auth/register**
  - ✅ Implementado: Email + Password registration
  - ✅ Password hashing com bcrypt
  - ✅ JWT token generation (7d expiry)
  - ✅ Response: `{ token, user: { id, email, role, studentId } }`

- **TRE-89 - POST /auth/login**
  - ✅ Implementado: Email + Password login
  - ✅ Password verification com bcrypt
  - ✅ JWT token returned on success
  - ✅ 401 Unauthorized on Invalid credentials

- **TRE-90 - Auth Middleware**
  - ✅ Implementado: `authMiddleware` em `backend/src/middleware/auth.js`
  - ✅ JWT token extraction from Authorization header
  - ✅ Token validation + payload extraction
  - ✅ `req.auth = { userId, email, role, studentId }` injected
  - ✅ 401 Unauthorized if token missing/invalid

- **TRE-91 - Role-based Access Control**
  - ✅ Implementado: Students GET filter by role
  - ✅ `personal` role: sees all students
  - ✅ `aluno` role: sees only self (via studentId)
  - ✅ Applied to GET /api/students

- **TRE-92 - Token Storage (Frontend)**
  - ✅ Implementado: `useAuth()` hook
  - ✅ Token persistence em localStorage (`token` key)
  - ✅ Automatic restore on app load
  - ✅ JWT payload decoding to extract user info

### Exercises Bank (TRE-93 épic)
- **TRE-94 - GET /api/exercises**
  - ✅ Implementado: List all public + personal's private exercises
  - ✅ Query params: `?muscle_group=peito`, `?search=supino`
  - ✅ Only accessible with valid JWT
  - ✅ Response: Array of exercise objects

- **TRE-95 - POST /api/exercises**
  - ✅ Implementado: Create exercise (personal only)
  - ✅ Fields: name, muscle_group, default_duration_s, youtube_id, is_public
  - ✅ personal_id set to current user
  - ✅ 403 Forbidden if not personal role

- **TRE-96 - PUT /api/exercises/:id**
  - ✅ Implementado: Update exercise (creator only)
  - ✅ Verify ownership: personal_id === req.auth.userId
  - ✅ 403 Forbidden if not creator

- **TRE-97 - DELETE /api/exercises/:id**
  - ✅ Implementado: Delete exercise (creator only)
  - ✅ Verify ownership before deletion
  - ✅ 204 No Content on success

### Frontend Auth UI (TRE-98 épic)
- **TRE-99 - Login Form**
  - ✅ Implementado: Replace old selector-based login
  - ✅ Email + Password form fields
  - ✅ Submit → POST /auth/login
  - ✅ Token saved via `useAuth()` hook
  - ✅ Redirect based on role: personal → /dashboard, aluno → /students/:studentId

- **TRE-100 - PrivateRoute Component**
  - ✅ Implementado: Route protection wrapper
  - ✅ Render children if valid token
  - ✅ Redirect to /login if token missing
  - ✅ Show loading state while restoring token

- **TRE-101 - API Client Updates**
  - ✅ Implementado: `useApi()` hook
  - ✅ Auto-injects token in all API calls
  - ✅ Updated all components to use useApi()
  - ✅ No need to manually pass token anymore

- **TRE-102 - Layout User Info**
  - ✅ Implementado: Show logged-in user email
  - ✅ Personal badge indicator
  - ✅ Logout button (🚪 emoji)
  - ✅ Clears localStorage + redirects to /

## 📝 Database Changes

### Table: users
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK(role IN ('personal', 'aluno')) NOT NULL,
  student_id TEXT REFERENCES students(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Table: exercises
```sql
CREATE TABLE exercises (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  muscle_group TEXT,
  default_duration_s INTEGER DEFAULT 30,
  youtube_id TEXT,
  personal_id TEXT NOT NULL REFERENCES users(id),
  is_public INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 Files Modified/Created

### Backend
- `backend/src/middleware/auth.js` — NEW: JWT middleware
- `backend/src/routes/auth.js` — NEW: /auth/login + /auth/register
- `backend/src/routes/exercises.js` — NEW: /exercises CRUD
- `backend/src/db/database.js` — UPDATED: users + exercises tables
- `backend/src/routes/students.js` — UPDATED: Role-based filtering
- `backend/server.js` — UPDATED: Wire auth + exercises routers
- `backend/package.json` — UPDATED: bcrypt + jsonwebtoken

### Frontend
- `frontend/src/hooks/useAuth.js` — NEW: Token management
- `frontend/src/hooks/useApi.js` — NEW: Auto-token injection
- `frontend/src/contexts/AuthContext.jsx` — NEW: Auth provider
- `frontend/src/components/PrivateRoute.jsx` — NEW: Route protection
- `frontend/src/pages/Login.jsx` — UPDATED: Email/password form
- `frontend/src/pages/Dashboard.jsx` — NEW: Personal trainer dashboard
- `frontend/src/components/Layout.jsx` — UPDATED: User info + logout
- `frontend/src/App.jsx` — UPDATED: PrivateRoute wrapping, /dashboard route
- `frontend/src/pages/students/*.jsx` — UPDATED: Use useApi() hook
- `frontend/src/api/client.js` — UPDATED: API methods accept token param

## ✅ Testing Completed

1. **Auth Register** — ✅ Creates user with bcrypt hash, returns JWT token
2. **Auth Login** — ✅ Validates credentials, returns token + user data
3. **Token Validation** — ✅ authMiddleware correctly decodes JWT
4. **Role Filtering** — ✅ Personal sees all students, aluno restricted
5. **Exercises CRUD** — ✅ POST creates exercise, GET returns empty initially
6. **Frontend Routing** — ✅ PrivateRoute redirects unauthenticated users
7. **Token Persistence** — ✅ useAuth hook restores from localStorage

## 🚀 Next Steps (Phase 3b — Exercises UI)

1. Create /exercises page with CRUD UI
2. Update WorkoutForm to include exercises dropdown
3. Add exercise selection when creating workout blocks
4. Implement search/filter by muscle group

## 📌 GitHub Commit

```
feat: Phase 3a - JWT auth, role-based access, exercises CRUD, frontend login
d258d56: https://github.com/gustavobarone-cmd/Treimaento-do-Barone/commit/d258d56
```

---

**Created by:** GitHub Copilot
**Date:** 2026-04-13
**Status:** Ready for Phase 3b
