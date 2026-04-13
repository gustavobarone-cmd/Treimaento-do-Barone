#!/usr/bin/env python3
"""
Script para criar um documento/wiki no Linear com descrição da aplicação
Usa Documents API do Linear
"""
import os
import requests

API_KEY = os.environ.get("LINEAR_API_KEY", "").strip()
if not API_KEY:
    print("❌ LINEAR_API_KEY não configurada!")
    exit(1)

API_URL = "https://api.linear.app/graphql"

DESCRIPTION_CONTENT = """# Personal Trainer App - Project Overview

## What is Personal Trainer App?

Personal Trainer App é uma aplicação web progressiva (PWA) para gerenciamento de treinamentos físicos. Permite que personal trainers criem e gerenciem planos de treino para seus alunos, com suporte a mobilidade/alongamento integrados e acompanhamento de execução em tempo real.

## Core Capabilities

### For Personal Trainers 👨‍🏫
- Student Management (cadastro, foto, histórico)
- Workout Creation (blocos de exercícios, duração estimada)
- Exercise Bank (vídeos YouTube, filtro por grupo muscular)
- Mobilidade Integration (pré e pós treino)
- Dashboard & Analytics (overview de alunos, treinos, atividade)

### For Students/Athletes 🏋️
- Workout Execution (interface guiada, vídeo em loop, timer)
- Workout History (log automático)
- PWA Benefits (offline, app nativo, sync)

## Technology Stack

- **Frontend**: React 18 + Vite 5, React Router, JWT Auth, localStorage
- **Backend**: Node.js/Express, SQLite WAL, bcrypt, jsonwebtoken
- **Architecture**: REST API, Role-based Access Control, Middleware Auth

## Authentication & Security

- **Phase 3 Implementation**: JWT tokens with 7-day expiry
- **Password Security**: bcrypt hashing (10 salt rounds)
- **Roles**: Personal trainer (personal) vs Student (aluno)
- **Access Control**: Role-based filtering, ownership validation

## Phases

1. ✅ **Phase 1**: Core MVP (Student management, Workout creation)
2. ✅ **Phase 2**: UI Redesign (Dark mode, Photo upload, Responsive)
3. ✅ **Phase 3**: Authentication & Dashboard (JWT auth, Exercise bank)
4. ⏳ **Phase 3c**: Analytics & Polish (Advanced analytics, Mobile opt)
5. ⏳ **Phase 4**: Production & Deployment

## Current Status (Phase 3)

✅ Backend: JWT auth + exercises CRUD
✅ Frontend: Login, Dashboard, Exercise Management
✅ Database: SQLite with users + exercises tables
✅ Tests: E2E flow validated
✅ Linux: 16 issues created with problems/solutions

## Key Files

### Backend
- `backend/src/middleware/auth.js` - JWT validation
- `backend/src/routes/auth.js` - Login/register
- `backend/src/routes/exercises.js` - Exercise CRUD

### Frontend
- `frontend/src/pages/Login.jsx` - Authentication
- `frontend/src/pages/Dashboard.jsx` - Stats & activity
- `frontend/src/pages/ExercisesList.jsx` - Exercise list
- `frontend/src/pages/ExerciseForm.jsx` - Create/edit

## Testing

✅ 7 backend endpoints tested
✅ 4 frontend components verified
✅ E2E flow: login → fetch → create

## Getting Started

```bash
# Backend
cd backend && npm install && npm run dev
# Runs on http://localhost:3001

# Frontend (new terminal)
cd frontend && npm install && npm run dev
# Runs on http://localhost:5173
```

## GitHub Repository

https://github.com/gustavobarone-cmd/Treimaento-do-Barone

**Phase 3 Commits**: 15 related commits with clean history
**Latest**: 32c5fb5 (Final delivery report)
"""

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
        return None, None
    
    teams = data.get("teams", {}).get("edges", [])
    for edge in teams:
        node = edge.get("node", {})
        if node.get("name") == "Treinamento Físico":
            return node.get("id"), "Treinamento Físico"
    
    return None, None

def create_document(team_id, title, content):
    """Create a document in Linear"""
    query = """
    mutation CreateDocument($input: DocumentCreateInput!) {
      documentCreate(input: $input) {
        success
        document {
          id
          title
          url
        }
      }
    }
    """
    
    variables = {
        "input": {
            "teamId": team_id,
            "title": title,
            "content": content,
        }
    }
    
    data = gql(query, variables)
    if not data:
        return None
    
    result = data.get("documentCreate", {})
    if result.get("success"):
        doc = result.get("document", {})
        return {
            "id": doc.get("id"),
            "title": doc.get("title"),
            "url": doc.get("url"),
        }
    
    return None

def main():
    print("🔗 Conectando ao Linear...")
    team_id, team_name = get_team_id()
    
    if not team_id:
        print(f"❌ Time 'Treinamento Físico' não encontrado!")
        return
    
    print(f"✅ Time encontrado: {team_name}\n")
    print("📝 Criando documento: Personal Trainer App - Project Description\n")
    
    result = create_document(team_id, "Personal Trainer App - Project Description", DESCRIPTION_CONTENT)
    
    if result:
        print(f"✅ Documento criado com sucesso!")
        print(f"   Title: {result['title']}")
        print(f"   URL: {result['url']}")
    else:
        print("⚠️  Não foi possível criar o documento.")
        print("    (Pode ser que a API de documents não esteja disponível neste workspace)")

if __name__ == "__main__":
    main()
