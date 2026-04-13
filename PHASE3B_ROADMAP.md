# Phase 3b — Exercises Page & Dashboard

**Status:** Planejado
**Épic Issues:** TRE-103 (exercises UI), TRE-104 (dashboard)
**Estimado:** ~5-7 dias

## 📋 Escopo

### Exercises Management Page (TRE-103)

**Issues:**
- **TRE-105 - Exercises List Page**
  - Route: `/exercises`
  - Protected: personal only
  - Grid/List view of exercises
  - Search + filter by muscle group
  - Buttons: New, Edit, Delete per exercise
  - Default exercises vs personal exercises tabs

- **TRE-106 - Exercise Form (Create/Edit)**
  - Form fields: name, muscle_group (dropdown), duration, youtube_id, is_public
  - YouTube video preview
  - Submit → POST /api/exercises or PUT /api/exercises/:id
  - Validation: name required, valid youtube_id format

- **TRE-107 - Exercise Delete**
  - Confirmation dialog
  - DELETE /api/exercises/:id
  - Remove from list on success

- **TRE-108 - WorkoutForm Integration**
  - Update WorkoutForm to fetch exercises from /api/exercises
  - When adding block, show exercise dropdown instead of free text
  - Auto-populate duration from exercise's default_duration_s

### Dashboard Page (TRE-104)

**Issues:**
- **TRE-109 - Dashboard Stats Cards**
  - Total students count
  - Active students (has active_period)
  - Workouts scheduled for today
  - Recent sessions (last 7 days)
  - Quick links: New Student, View All

- **TRE-110 - Recent Activity**
  - List of last 10 workout sessions
  - Per student: name, workout, completed/in-progress status
  - Link to student detail

- **TRE-111 - Active Period Overview**
  - Table: student, period, start/end dates, workouts count
  - Mark/edit active periods

- **TRE-112 - Dashboard for Aluno**
  - Redirect aluno → /students/:studentId instead of /students
  - Personal trainer dashboard stays at /dashboard for personal role

## 🧪 Test Cases

### Exercises
1. Create exercise with youtube_id → preview shows
2. Edit exercise → changes reflected in list
3. Delete exercise → removed from list
4. Filter by muscle_group → only matching exercises shown
5. WorkoutForm block creation → exercise dropdown populated

### Dashboard
1. Login as personal → redirect to /dashboard
2. Stats show correct totals
3. Recent activity updates after new session
4. Click student in activity → navigate to detail page

## 🗓️ Timeline

**Day 1-2:** Exercises page (CRUD UI, integration with WorkoutForm)
**Day 3-4:** Dashboard implementation (stats, activity, styling)
**Day 5:** Testing + bug fixes
**Day 6-7:** Polish + edge cases

## 📌 Acceptance Criteria

- ✅ Exercises CRUD page fully functional
- ✅ WorkoutForm uses exercises dropdown
- ✅ Dashboard shows accurate stats
- ✅ Personal trainers redirected to /dashboard on login
- ✅ All routes protected (PrivateRoute applied)
- ✅ Tests pass: auth, exercises CRUD, dashboard load

## 🔗 Depends On

- ✅ Phase 3a — Auth + exercises backend (COMPLETED)
- ⏳ Phase 3b — Frontend UI (THIS PHASE)
- 📋 Phase 3c — Dashboard + role-based routing (AFTER THIS)

---

**Priority:** HIGH (Closes auth + exercises workflows)
**Created:** 2026-04-13
