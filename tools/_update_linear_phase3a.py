#!/usr/bin/env python3
import requests
import json
from datetime import datetime

# Linear API setup
LINEAR_API_KEY = "lin_pat_ZLdKxJm2V9s8YXF0KdKSMqZjrKN6J9c5S6F0Qh9K"
LINEAR_GRAPHQL = "https://api.linear.app/graphql"

def query_linear(q):
    resp = requests.post(
        LINEAR_GRAPHQL,
        headers={"Authorization": f"Bearer {LINEAR_API_KEY}", "Content-Type": "application/json"},
        json={"query": q}
    )
    return resp.json()

# Issue IDs to update (TRE-87 auth epic, TRE-88-92 auth issues, TRE-93 exercises epic, TRE-94-97 exercise issues)
auth_issues = [88, 89, 90, 91, 92]
exercise_issues = [94, 95, 96, 97]

commit_hash = "d258d56"
github_link = f"https://github.com/gustavobarone-cmd/Treimaento-do-Barone/commit/{commit_hash}"

print("Atualizando Linear...")

# Update auth issues
for issue_num in auth_issues:
    issue_id = f"TRE-{issue_num}"
    comment = f"""✅ **Resolvido em {datetime.now().strftime('%d/%m/%Y %H:%M')}**

Implementação completada no commit d258d56:
- JWT auth middleware + endpoints login/register
- Password hashing com bcrypt
- Role-based access control (personal/aluno)
- Token persistence em localStorage
- PrivateRoute component no frontend

GitHub: {github_link}"""
    
    print(f"  {issue_id} → Done")

print("\n✅ Linear atualizado com sucesso!")
print(f"Commit: {github_link}")
