"""
Script para criar um documento/descrição do projeto no Linear
"""
import os
import requests

API_KEY = os.environ.get("LINEAR_API_KEY", "").strip()
if not API_KEY:
    print("❌ LINEAR_API_KEY não configurada!")
    exit(1)

API_URL = "https://api.linear.app/graphql"

PROJECT_DESCRIPTION = """
# Personal Trainer App

## Overview

Personal Trainer App é uma aplicação web progressiva (PWA) para gerenciamento de treinamentos físicos. Permite que personal trainers criem e gerenciem planos de treino para seus alunos, com suporte a mobilidade/alongamento integrados e acompanhamento de execução em tempo real.

## Key Features

### For Personal Trainers 👨‍🏫

- **Student Management**: Cadastro de alunos com foto/avatar, organização por períodos
- **Workout Creation**: Criar treinos estruturados com blocos de exercícios
- **Exercise Bank**: Banco de exercícios com vídeos YouTube, filtro por grupo muscular
- **Mobilidade Integration**: Alongamentos pré-treino personalizados
- **Dashboard & Analytics**: Visão geral de alunos, ativos, treinos

### For Students/Athletes 🏋️

- **Workout Execution**: Interface guiada com vídeo, timer, beep/voz
- **Workout History**: Log automático de cada treino
- **PWA Benefits**: Funciona offline, instável como app nativo

## Tech Stack

- **Frontend**: React 18 + Vite 5, React Router v6, JWT Auth
- **Backend**: Node.js/Express, SQLite, bcrypt, jsonwebtoken
- **Deployment**: GitHub Pages (frontend), Node.js server (backend)

## API Endpoints (Phase 3)

### Authentication
- POST /api/auth/register
- POST /api/auth/login

### Exercises (Exercise Bank)
- GET    /api/exercises (list with filters)
- GET    /api/exercises/:id
- POST   /api/exercises (create - personal only)
- PUT    /api/exercises/:id (update - owner only)
- DELETE /api/exercises/:id (delete - owner only)

## Development Phases

✅ **Phase 1**: Core MVP (Student management, Workout creation)
✅ **Phase 2**: UI Redesign (Dark mode, Photo upload, Responsive)
✅ **Phase 3**: Authentication & Dashboard (JWT auth, Exercise bank) - CURRENT
⏳ **Phase 3c**: Analytics & Polish (Advanced analytics, Mobile opt)
⏳ **Phase 4**: Production & Deployment (DB setup, Security, Monitoring)

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

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

## Test Account

- Email: personal@test.local
- Password: senha123
- Role: personal

## Database Schema

### Users Table
- id (UUID), email (unique), password_hash (bcrypt), role, student_id, timestamps

### Exercises Table
- id (UUID), name, muscle_group, default_duration_s, youtube_id, personal_id, is_public, timestamps

## Latest Commits

- 0a0dc95 feat: Add script to create Phase 3 issues in Linear
- 0ef7c85 docs: Add comprehensive delivery summary
- 70a635b docs: Add Linear update guide
- e4b303e docs: Add Linear integration documents
- 2d39f7f test: Complete end-to-end flow testing
- ed579c2 feat: Add field normalization

## Current Status

✅ Backend running on port 3001
✅ Frontend running on port 5173
✅ Database: SQLite with users + exercises tables
✅ Authentication: JWT working
✅ CRUD: All operations tested
✅ 16 Phase 3 issues created in Linear

## Team

Project: Treinamento Físico
Repository: https://github.com/gustavobarone-cmd/Treimaento-do-Barone

## Next Steps

1. ✅ Phase 3 implementation (complete)
2. ✅ Linear integration (complete)
3. ⏳ Phase 3c: Analytics & Polish
4. ⏳ Phase 4: Production deployment
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

def get_project_id():
    query = """
    query {
      projects(first: 100) {
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
    
    projects = data.get("projects", {}).get("edges", [])
    for edge in projects:
        node = edge.get("node", {})
        if "Personal Trainer" in node.get("name", ""):
            return node.get("id")
    
    return None

def update_project_description(project_id):
    query = """
    mutation UpdateProject($input: ProjectUpdateInput!) {
      projectUpdate(input: $input) {
        success
        project {
          id
          name
          description
        }
      }
    }
    """
    
    variables = {
        "input": {
            "id": project_id,
            "description": PROJECT_DESCRIPTION,
        }
    }
    
    data = gql(query, variables)
    if not data:
        return False
    
    result = data.get("projectUpdate", {})
    return result.get("success", False)

def main():
    print("🔗 Conectando ao Linear...")
    project_id = get_project_id()
    
    if not project_id:
        print("❌ Projeto não encontrado!")
        return
    
    print(f"✅ Projeto encontrado: {project_id}")
    print("\n📝 Atualizando descrição do projeto...\n")
    
    success = update_project_description(project_id)
    
    if success:
        print("✅ Descrição do projeto atualizada com sucesso no Linear!")
    else:
        print("⚠️  Não foi possível atualizar a descrição.")

if __name__ == "__main__":
    main()
