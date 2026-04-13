# Linear Issues - Phase 3 Problems & Solutions

## Overview

Este documento lista todos os problemas encontrados durante Phase 3 e suas soluções implementadas. Para adicionar ao Linear, use o script em `tools/create_linear_issues.py` ou crie as issues manualmente.

---

## Phase 3a: Authentication & Backend

### Issue TRE-87: JWT Authentication Implementation ✅

**Problem:**
- Need secure authentication system for separating personal trainer and student access
- Passwords must be securely hashed
- No existing auth middleware

**Solution Implemented:**
- ✅ Created `backend/src/middleware/auth.js` with JWT validation
- ✅ Implemented bcrypt password hashing (saltRounds=10)
- ✅ Generated JWT tokens with 7-day expiry
- ✅ Added token verification on protected routes
- ✅ Injected user data (userId, email, role) into request object

**Commit:** `d258d56`

---

### Issue TRE-88: User Registration Endpoint ✅

**Problem:**
- Need endpoint for new user registration
- Passwords must not be stored in plain text
- Need to associate users with students optionally

**Solution Implemented:**
- ✅ Created `POST /api/auth/register` endpoint
- ✅ Accepts: email, password, role (personal|aluno), studentId (optional)
- ✅ Validates email format and password strength
- ✅ Hashes password with bcrypt before storage
- ✅ Returns JWT token on successful registration

**Commit:** `d258d56`

---

### Issue TRE-89: User Login Endpoint ✅

**Problem:**
- Need login endpoint to authenticate existing users
- Must verify credentials securely
- Must return JWT token for subsequent requests

**Solution Implemented:**
- ✅ Created `POST /api/auth/login` endpoint
- ✅ Validates email and password
- ✅ Compares against bcrypt hash in database
- ✅ Generates JWT token with user data
- ✅ Tested and verified working

**Commits:** `d258d56`, `ed579c2` (field normalization)

---

### Issue TRE-90: Database Users Table ✅

**Problem:**
- Need to store user credentials securely
- Need to track roles (personal vs aluno)
- Need to link users to students

**Solution Implemented:**
- ✅ Created SQLite table `users` with:
  - id (UUID primary key)
  - email (unique, required)
  - password_hash (bcrypt hashed)
  - role (CHECK constraint: personal|aluno)
  - student_id (optional FK to students)
  - created_at, updated_at timestamps

**Commit:** `d258d56`

---

### Issue TRE-91: Role-Based Access Control ✅

**Problem:**
- Personal trainers need different access than students
- Students should only see their own data
- Some endpoints should be personal-only

**Solution Implemented:**
- ✅ Added `req.auth.role` check in middleware
- ✅ Modified `GET /api/students` to filter by role:
  - personal: sees all students
  - aluno: sees only self (via studentId)
- ✅ Exercise creation restricted to personal only
- ✅ Exercise ownership enforced on edit/delete

**Commit:** `d258d56`

---

## Phase 3b: Exercise Bank Backend & Frontend

### Issue TRE-92: Database Exercises Table ✅

**Problem:**
- Need to store exercise templates
- Must include video references
- Must support public/private visibility
- Must track ownership

**Solution Implemented:**
- ✅ Created SQLite table `exercises` with:
  - id (UUID primary key)
  - name, muscle_group, default_duration_s
  - youtube_id (for video preview)
  - personal_id (creator/owner)
  - is_public (0|1 for visibility)
  - created_at, updated_at timestamps

**Commit:** `d258d56`

---

### Issue TRE-93: Exercises CRUD API Endpoints ✅

**Problem:**
- Need full CRUD for exercises
- Must filter by visibility (public vs private)
- Must include search and muscle group filtering
- Must enforce ownership on updates/deletes

**Solution Implemented:**
- ✅ `GET /api/exercises` - List with filters
  - Query params: `?muscle_group=X&q=searchTerm`
  - Shows public + user's private exercises
- ✅ `GET /api/exercises/:id` - Single exercise with visibility check
- ✅ `POST /api/exercises` - Create (personal only)
- ✅ `PUT /api/exercises/:id` - Update (owner only)
- ✅ `DELETE /api/exercises/:id` - Delete (owner only)
- ✅ All tested and verified working

**Commits:** `d258d56`, `ed579c2`

---

### Issue TRE-94: Field Normalization (snake_case ↔ camelCase) ✅

**Problem:**
- Frontend sends snake_case field names (muscle_group, youtube_id, etc.)
- Backend expected camelCase (muscleGroup, youtubeId, etc.)
- API would reject valid requests due to field name mismatch

**Solution Implemented:**
- ✅ Created `normalizeFields()` helper function in `exercises.js`
- ✅ Backend now accepts BOTH formats for compatibility
- ✅ Conversion happens before processing
- ✅ Query parameters also support both: `?muscle_group=` and `?muscleGroup=`
- ✅ Backward compatible - existing camelCase requests still work
- ✅ Tested: POST, PUT, GET filtering all working

**Commit:** `ed579c2`

**Test Results:**
```
✅ POST with snake_case fields → Created successfully
✅ PUT with snake_case fields → Updated successfully  
✅ GET with muscle_group parameter → Filtered correctly
```

---

### Issue TRE-95: Login Page UI ✅

**Problem:**
- Need user-friendly login form
- Must handle authentication and token storage
- Must redirect based on user role

**Solution Implemented:**
- ✅ Created `frontend/src/pages/Login.jsx`
- ✅ Email input field with validation
- ✅ Password input field
- ✅ Submit button with loading state
- ✅ Error message display
- ✅ Token saved to localStorage on success
- ✅ Redirects: personal → /dashboard, aluno → /students

**Commits:** `cae4ae5`, `f90a943`

---

### Issue TRE-96: useAuth Hook (Token Management) ✅

**Problem:**
- Need centralized token management
- Must persist token in localStorage
- Must provide token to components
- Should decode JWT to get user data

**Solution Implemented:**
- ✅ Created `frontend/src/hooks/useAuth.js`
- ✅ Manages token state with localStorage sync
- ✅ Provides: token, user, loading, login(), logout()
- ✅ Decodes JWT to extract user info
- ✅ Handles token expiry detection

**Commits:** `cae4ae5`, `f90a943`

---

### Issue TRE-97: useApi Hook (Auto Token Injection) ✅

**Problem:**
- Repeatedly adding token header to every API call is repetitive
- Need automatic token injection for all requests
- Easy way to update centrally if token changes

**Solution Implemented:**
- ✅ Created `frontend/src/hooks/useApi.js`
- ✅ Wraps all API methods from `frontend/src/api/client.js`
- ✅ Automatically injects token in headers
- ✅ Works with GET, POST, PUT, DELETE
- ✅ All components use this hook instead of direct API calls

**Commits:** `cae4ae5`, `f90a943`

---

### Issue TRE-98: PrivateRoute Component ✅

**Problem:**
- Need to protect routes from unauthenticated access
- Should redirect to login if no token present
- Should show loading state while auth is being checked

**Solution Implemented:**
- ✅ Created `frontend/src/components/PrivateRoute.jsx`
- ✅ Wraps protected routes in App.jsx
- ✅ Checks for valid token before rendering
- ✅ Shows loading component if auth is loading
- ✅ Redirects to login if authenticated fails

**Commits:** `cae4ae5`, `f90a943`

---

### Issue TRE-99: Dashboard Page ✅

**Problem:**
- Need homepage for personal trainer showing overview
- Should display key metrics (students count, active, workouts)
- Should show recent activity

**Solution Implemented:**
- ✅ Created `frontend/src/pages/Dashboard.jsx`
- ✅ Shows stats cards:
  - Total students managed
  - Active students (with workouts in current period)
  - Total workouts created
- ✅ Recent workouts feed below
- ✅ Responsive design for mobile

**Commits:** `cae4ae5`, `f90a943`

---

### Issue TRE-100: Exercises List Page ✅

**Problem:**
- Need to view all available exercises
- Must support search and filtering by muscle group
- Must allow delete with confirmation

**Solution Implemented:**
- ✅ Created `frontend/src/pages/ExercisesList.jsx`
- ✅ Search input with real-time filtering
- ✅ Muscle group dropdown filter
- ✅ Exercise list display
- ✅ Edit button (link to edit page)
- ✅ Delete button with confirmation
- ✅ Responsive table layout

**Commits:** `cae4ae5`, `f90a943`

**Note:** Import path was initially incorrect (`../../hooks`), fixed in commit `f435e48`

---

### Issue TRE-101: Exercises Form Page ✅

**Problem:**
- Need to create and edit exercises
- Must accept exercise details including YouTube video
- Should preview YouTube video thumbnail
- Toggle for public/private visibility

**Solution Implemented:**
- ✅ Created `frontend/src/pages/ExerciseForm.jsx`
- ✅ Supports both create and edit modes
- ✅ Fields: name, muscle_group, youtube_id, duration, is_public
- ✅ YouTube preview showing thumbnail
- ✅ Extract YouTube ID from full URL or direct ID
- ✅ Muscle group dropdown with 11 options
- ✅ Form validation and error handling

**Commits:** `cae4ae5`, `f90a943`

**Note:** Import path was initially incorrect (`../../hooks`), fixed in commit `f435e48`

---

### Issue TRE-102: Import Path Fixes ✅

**Problem:**
- Vite dev server showing errors: "Failed to resolve import '../../hooks/useApi'"
- Files in `src/pages/` importing from wrong relative path
- Build warnings and potential runtime issues

**Solution Implemented:**
- ✅ Fixed `ExercisesList.jsx`: `../../hooks/useApi` → `../hooks/useApi`
- ✅ Fixed `ExerciseForm.jsx`: `../../hooks/useApi` → `../hooks/useApi`
- ✅ All other components already had correct paths
- ✅ Frontend dev server now runs cleanly

**Commit:** `f435e48`

**Test Result:**
```
Before: Vite error shown in console
After: ✅ VITE v5.4.21 ready in 405 ms (no errors)
```

---

## Phase 3c: Planned Enhancements (Not Yet Implemented)

### Issue TRE-103: JWT Refresh Token Flow
**Status:** ⏳ Deferred
- Currently: 7-day fixed expiry
- Planned: Implement refresh token rotation for better security

### Issue TRE-104: Advanced Analytics Dashboard
**Status:** ⏳ Deferred
- Planned: Charts showing student progress, workout trends
- Includes: Historical data visualization

### Issue TRE-105: Mobile Optimization
**Status:** ⏳ Deferred
- Planned: Touch-friendly buttons, responsive breakpoints
- Testing on actual mobile devices

### Issue TRE-106: Offline Support Enhancement
**Status:** ⏳ Deferred
- Planned: Service worker improvements for better offline functionality
- Data sync when reconnected

---

## Summary

| Category | Count | Status |
|----------|-------|--------|
| Authentication Issues | 5 | ✅ Complete |
| Backend Issues | 3 | ✅ Complete |
| Frontend Issues | 9 | ✅ Complete |
| Fixes/Improvements | 2 | ✅ Complete |
| Deferred (Phase 3c) | 4 | ⏳ Planned |
| **Total Phase 3** | **19** | **✅ Complete** |

---

## How to Update Linear

### Option 1: Use Python Script (Automated)
```bash
# Set API key (get from Linear settings)
set LINEAR_API_KEY=lin_api_YOUR_TOKEN

# Run script
python tools/create_linear_issues.py
```

### Option 2: Manual Update
1. Go to Linear: https://linear.app
2. For each issue above, create a new issue in project "Personal Trainer App"
3. Link to epic "Phase 3: Authentication & Dashboard"
4. Add problem/solution in description
5. Link GitHub commits where applicable

### Option 3: Use Issue Templates
Create issues from templates and fill in:
- Title: Issue title from above
- Problem: "Problem" section
- Solution: "Solution Implemented" section
- Commit: Link to commit

