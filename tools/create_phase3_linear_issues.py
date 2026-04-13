"""
Script para criar issues de Phase 3 no Linear com problemas/soluções
"""
import os
import requests
import json

API_KEY = os.environ.get("LINEAR_API_KEY", "").strip()
if not API_KEY:
    print("❌ LINEAR_API_KEY não configurada!")
    exit(1)

API_URL = "https://api.linear.app/graphql"
TEAM_NAME = "Treinamento Físico"

# Issues com problemas e soluções
PHASE3_ISSUES = [
    {
        "title": "JWT Authentication Implementation",
        "problem": "Need secure authentication system for separating personal trainer and student access. Passwords must be securely hashed. No existing auth middleware.",
        "solution": "✅ Created backend/src/middleware/auth.js with JWT validation\n✅ Implemented bcrypt password hashing (saltRounds=10)\n✅ Generated JWT tokens with 7-day expiry\n✅ Added token verification on protected routes\n✅ Injected user data (userId, email, role) into request object",
        "commit": "d258d56",
    },
    {
        "title": "User Registration Endpoint",
        "problem": "Need endpoint for new user registration. Passwords must not be stored in plain text. Need to associate users with students optionally.",
        "solution": "✅ Created POST /api/auth/register endpoint\n✅ Accepts: email, password, role (personal|aluno), studentId (optional)\n✅ Validates email format and password strength\n✅ Hashes password with bcrypt before storage\n✅ Returns JWT token on successful registration",
        "commit": "d258d56",
    },
    {
        "title": "User Login Endpoint",
        "problem": "Need login endpoint to authenticate existing users. Must verify credentials securely. Must return JWT token for subsequent requests.",
        "solution": "✅ Created POST /api/auth/login endpoint\n✅ Validates email and password\n✅ Compares against bcrypt hash in database\n✅ Generates JWT token with user data\n✅ Tested and verified working",
        "commit": "d258d56",
    },
    {
        "title": "Database Users Table",
        "problem": "Need to store user credentials securely. Need to track roles (personal vs aluno). Need to link users to students.",
        "solution": "✅ Created SQLite table users with:\n  - id (UUID primary key)\n  - email (unique, required)\n  - password_hash (bcrypt hashed)\n  - role (CHECK constraint: personal|aluno)\n  - student_id (optional FK to students)\n  - created_at, updated_at timestamps",
        "commit": "d258d56",
    },
    {
        "title": "Role-Based Access Control",
        "problem": "Personal trainers need different access than students. Students should only see their own data. Some endpoints should be personal-only.",
        "solution": "✅ Added req.auth.role check in middleware\n✅ Modified GET /api/students to filter by role:\n  - personal: sees all students\n  - aluno: sees only self (via studentId)\n✅ Exercise creation restricted to personal only\n✅ Exercise ownership enforced on edit/delete",
        "commit": "d258d56",
    },
    {
        "title": "Database Exercises Table",
        "problem": "Need to store exercise templates. Must include video references. Must support public/private visibility. Must track ownership.",
        "solution": "✅ Created SQLite table exercises with:\n  - id (UUID primary key)\n  - name, muscle_group, default_duration_s\n  - youtube_id (for video preview)\n  - personal_id (creator/owner)\n  - is_public (0|1 for visibility)\n  - created_at, updated_at timestamps",
        "commit": "d258d56",
    },
    {
        "title": "Exercises CRUD API Endpoints",
        "problem": "Need full CRUD for exercises. Must filter by visibility (public vs private). Must include search and muscle group filtering. Must enforce ownership on updates/deletes.",
        "solution": "✅ GET /api/exercises - List with filters\n  - Query params: ?muscle_group=X&q=searchTerm\n  - Shows public + user's private exercises\n✅ GET /api/exercises/:id - Single exercise with visibility check\n✅ POST /api/exercises - Create (personal only)\n✅ PUT /api/exercises/:id - Update (owner only)\n✅ DELETE /api/exercises/:id - Delete (owner only)\n✅ All tested and verified working",
        "commit": "d258d56",
    },
    {
        "title": "Field Normalization (snake_case ↔ camelCase)",
        "problem": "Frontend sends snake_case field names (muscle_group, youtube_id, etc.). Backend expected camelCase (muscleGroup, youtubeId, etc.). API would reject valid requests due to field name mismatch.",
        "solution": "✅ Created normalizeFields() helper in exercises.js\n✅ Backend now accepts BOTH formats for compatibility\n✅ Conversion happens before processing\n✅ Query parameters also support both: ?muscle_group= and ?muscleGroup=\n✅ Backward compatible - existing camelCase requests still work\n✅ Tested: POST, PUT, GET filtering all working",
        "commit": "ed579c2",
    },
    {
        "title": "Login Page UI",
        "problem": "Need user-friendly login form. Must handle authentication and token storage. Must redirect based on user role.",
        "solution": "✅ Created frontend/src/pages/Login.jsx\n✅ Email input field with validation\n✅ Password input field\n✅ Submit button with loading state\n✅ Error message display\n✅ Token saved to localStorage on success\n✅ Redirects: personal → /dashboard, aluno → /students",
        "commit": "cae4ae5",
    },
    {
        "title": "useAuth Hook (Token Management)",
        "problem": "Need centralized token management. Must persist token in localStorage. Must provide token to components. Should decode JWT to get user data.",
        "solution": "✅ Created frontend/src/hooks/useAuth.js\n✅ Manages token state with localStorage sync\n✅ Provides: token, user, loading, login(), logout()\n✅ Decodes JWT to extract user info\n✅ Handles token expiry detection",
        "commit": "cae4ae5",
    },
    {
        "title": "useApi Hook (Auto Token Injection)",
        "problem": "Repeatedly adding token header to every API call is repetitive. Need automatic token injection for all requests. Easy way to update centrally if token changes.",
        "solution": "✅ Created frontend/src/hooks/useApi.js\n✅ Wraps all API methods from frontend/src/api/client.js\n✅ Automatically injects token in headers\n✅ Works with GET, POST, PUT, DELETE\n✅ All components use this hook instead of direct API calls",
        "commit": "cae4ae5",
    },
    {
        "title": "PrivateRoute Component",
        "problem": "Need to protect routes from unauthenticated access. Should redirect to login if no token present. Should show loading state while auth is being checked.",
        "solution": "✅ Created frontend/src/components/PrivateRoute.jsx\n✅ Wraps protected routes in App.jsx\n✅ Checks for valid token before rendering\n✅ Shows loading component if auth is loading\n✅ Redirects to login if authenticated fails",
        "commit": "cae4ae5",
    },
    {
        "title": "Dashboard Page",
        "problem": "Need homepage for personal trainer showing overview. Should display key metrics (students count, active, workouts). Should show recent activity.",
        "solution": "✅ Created frontend/src/pages/Dashboard.jsx\n✅ Shows stats cards:\n  - Total students managed\n  - Active students (with workouts in current period)\n  - Total workouts created\n✅ Recent workouts feed below\n✅ Responsive design for mobile",
        "commit": "cae4ae5",
    },
    {
        "title": "Exercises List Page",
        "problem": "Need to view all available exercises. Must support search and filtering by muscle group. Must allow delete with confirmation.",
        "solution": "✅ Created frontend/src/pages/ExercisesList.jsx\n✅ Search input with real-time filtering\n✅ Muscle group dropdown filter\n✅ Exercise list display\n✅ Edit button (link to edit page)\n✅ Delete button with confirmation\n✅ Responsive table layout",
        "commit": "cae4ae5",
    },
    {
        "title": "Exercises Form Page",
        "problem": "Need to create and edit exercises. Must accept exercise details including YouTube video. Should preview YouTube video thumbnail. Toggle for public/private visibility.",
        "solution": "✅ Created frontend/src/pages/ExerciseForm.jsx\n✅ Supports both create and edit modes\n✅ Fields: name, muscle_group, youtube_id, duration, is_public\n✅ YouTube preview showing thumbnail\n✅ Extract YouTube ID from full URL or direct ID\n✅ Muscle group dropdown with 11 options\n✅ Form validation and error handling",
        "commit": "cae4ae5",
    },
    {
        "title": "Import Path Fixes",
        "problem": "Vite dev server showing errors: Failed to resolve import '../../hooks/useApi'. Files in src/pages/ importing from wrong relative path. Build warnings and potential runtime issues.",
        "solution": "✅ Fixed ExercisesList.jsx: ../../hooks/useApi → ../hooks/useApi\n✅ Fixed ExerciseForm.jsx: ../../hooks/useApi → ../hooks/useApi\n✅ All other components already had correct paths\n✅ Frontend dev server now runs cleanly",
        "commit": "f435e48",
    },
]

def gql(query, variables=None):
    payload = {"query": query}
    if variables:
        payload["variables"] = variables
    
    headers = {
        "Authorization": API_KEY,
        "Content-Type": "application/json",
    }
    
    resp = requests.post(API_URL, json=payload, headers=headers, timeout=10)
    if resp.status_code != 200:
        print(f"❌ API error {resp.status_code}: {resp.text}")
        return None
    
    data = resp.json()
    if "errors" in data:
        print(f"❌ GraphQL error: {data['errors']}")
        return None
    
    return data.get("data", {})

def get_team_id():
    query = """
    query {
      teams(first: 100) {
        edges {
          node {
            id
            name
          }
        }
      }
    }
    """
    data = gql(query)
    if not data:
        return None
    
    teams = data.get("teams", {}).get("edges", [])
    for edge in teams:
        node = edge.get("node", {})
        if node.get("name") == TEAM_NAME:
            return node.get("id")
    
    return None

def create_epic(team_id, title):
    query = """
    mutation CreateEpic($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue {
          id
          identifier
          title
        }
      }
    }
    """
    variables = {
        "input": {
            "teamId": team_id,
            "title": title,
            "description": "Phase 3: Authentication & Dashboard",
        }
    }
    
    data = gql(query, variables)
    if not data:
        return None
    
    result = data.get("issueCreate", {})
    if result.get("success"):
        issue = result.get("issue", {})
        return issue.get("id")
    
    return None

def create_issue(team_id, title, description, epic_id=None):
    query = """
    mutation CreateIssue($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue {
          id
          identifier
          title
        }
      }
    }
    """
    
    desc = f"## Problem\n{description.get('problem', '')}\n\n## Solution Implemented\n{description.get('solution', '')}\n\n## Commit\nhttps://github.com/gustavobarone-cmd/Treimaento-do-Barone/commit/{description.get('commit', '')}"
    
    input_data = {
        "teamId": team_id,
        "title": title,
        "description": desc,
    }
    
    if epic_id:
        input_data["parentId"] = epic_id
    
    variables = {"input": input_data}
    
    data = gql(query, variables)
    if not data:
        return None
    
    result = data.get("issueCreate", {})
    if result.get("success"):
        issue = result.get("issue", {})
        return {
            "id": issue.get("id"),
            "identifier": issue.get("identifier"),
            "title": issue.get("title"),
        }
    
    return None

def main():
    print("🔗 Conectando ao Linear...")
    team_id = get_team_id()
    
    if not team_id:
        print(f"❌ Time '{TEAM_NAME}' não encontrado!")
        return
    
    print(f"✅ Time encontrado: {team_id}\n")
    
    # Create epic for Phase 3
    print("📌 Criando épico: Phase 3 - Authentication & Dashboard")
    epic_id = create_epic(team_id, "Phase 3: Authentication & Dashboard")
    if epic_id:
        print(f"   → Épico criado com ID {epic_id}\n")
    else:
        print("   ⚠️  Não foi possível criar épico, continuando sem vinculação...\n")
        epic_id = None
    
    # Create issues
    print("📝 Criando issues de Phase 3:\n")
    for i, issue_data in enumerate(PHASE3_ISSUES, 1):
        result = create_issue(
            team_id,
            issue_data["title"],
            {
                "problem": issue_data["problem"],
                "solution": issue_data["solution"],
                "commit": issue_data["commit"],
            },
            epic_id,
        )
        
        if result:
            print(f"   ✓ {result['identifier']} — {result['title']}")
        else:
            print(f"   ✗ {issue_data['title']} (erro ao criar)")
    
    print(f"\n✅ Concluído! {len(PHASE3_ISSUES)} issues de Phase 3 criadas.")

if __name__ == "__main__":
    main()
