# Phase 3c — Analytics & Refinements

**Status:** Planejado
**Épic Issues:** TRE-113 (analytics), TRE-114 (refinements)
**Estimado:** ~7-10 dias

## 📋 Escopo

### Analytics Dashboard (TRE-113)

**Issues:**
- **TRE-115 - Workouts Per Student Chart**
  - Bar chart: X = student, Y = workouts count
  - Get from GET /students (iterate workouts per student)
  - Show top 5 most active students
  - Drill-down: Click student → view detail

- **TRE-116 - Exercises Popularity**
  - Pie/Donut chart: Most used exercises
  - Aggregate from all students' workouts
  - Show frequency (how many times exercise appears in workouts)
  - Filter by date range (last month, last quarter)

- **TRE-117 - Student Adherence**
  - Adherence %: (sessions completed / sessions planned)
  - Per student or aggregate
  - Calculate from workout_logs.is_completed
  - Show trend over time (weekly/monthly)

- **TRE-118 - Dashboard Date Range Filter**
  - Date picker: From/To
  - Apply to all charts
  - Default: Last 30 days
  - Save preference to localStorage

### UX Refinements (TRE-114)

**Issues:**
- **TRE-119 - Navigation Menu**
  - Sidebar or hamburger menu (mobile-first)
  - Items: Dashboard, Alunos, Exercícios, Configurações
  - Active state indicator
  - Quick search box

- **TRE-120 - Settings Page**
  - Personal trainer profile (email, name, phone)
  - Edit profile + avatar upload
  - Change password
  - Backup/export data (JSON)
  - Clear old logs (retention policy)

- **TRE-121 - Student Card Redesign**
  - Summary: name, photo, active period, next workout
  - "Start workout" CTA button
  - Quick stats: workouts count, adherence %
  - Edit button (quick access)

- **TRE-122 - Empty States**
  - Meaningful messages + CTAs for all pages
  - First-time setup wizard (onboarding)
  - Tips/hints for new users

- **TRE-123 - Performance Optimization**
  - Lazy load: Dashboard stats, charts
  - Pagination: Student list (20 per page)
  - Cache API responses (React Query or similar)
  - Image optimization (compress uploads)

### Mobile Experience (TRE-124)

**Issues:**
- **TRE-125 - Responsive Layouts**
  - Test all pages on iPhone 12, 14, Pro Max
  - Adjust typography scale
  - Touch targets > 48px
  - Navigation accessible at bottom (mobile navbar)

- **TRE-126 - Touch Gestures**
  - Swipe to delete (undo confirmation)
  - Long-press for context menu
  - Pinch to zoom on images/charts

- **TRE-127 - Offline Support**
  - Service Worker caching
  - Queue API calls when offline
  - Sync when reconnected

## 🧪 Test Cases

### Analytics
1. Chart renders with correct data
2. Date filter updates all charts
3. Drill-down navigates to student detail
4. Export data as JSON

### Refinements
1. Navigation shows all sections
2. Settings page allows profile edit + password change
3. Student card shows summary + quick actions
4. Empty states have meaningful CTAs

### Mobile
1. All pages responsive on small screens
2. Touch targets accessible (44px+)
3. Navigation works on mobile
4. Forms fill on iOS/Android (no zoom)

## 📱 Devices to Test
- iPhone 12 (390×844)
- iPhone 14 Pro Max (430×932)
- iPad (768×1024)
- Android: Pixel 4 (412×655)

## 🗓️ Timeline

**Day 1-2:** Setup charting library (Chart.js or Recharts), build analytics dashboard
**Day 3:** Student adherence + trends
**Day 4-5:** Navigation menu + settings page
**Day 6-7:** Mobile refinements, responsive testing
**Day 8-9:** Offline support, service worker setup
**Day 10:** Testing + polish

## 📌 Acceptance Criteria

- ✅ Analytics dashboard shows 3+ chart types
- ✅ All pages responsive (mobile-first)
- ✅ Navigation intuitive (personal trainers + alunos)
- ✅ Settings page functional
- ✅ Performance: Dashboard loads < 2s
- ✅ Offline mode works (cached data)

## 🔗 Depends On

- ✅ Phase 3a — Auth + exercises (COMPLETED)
- ✅ Phase 3b — Exercises UI + dashboard (COMPLETED)
- ⏳ Phase 3c — Analytics + refinements (THIS PHASE)

---

**Priority:** MEDIUM (Nice-to-have, improves UX but not core functionality)
**Created:** 2026-04-13
**Next review:** After Phase 3b completion
