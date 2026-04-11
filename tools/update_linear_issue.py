"""
Atualiza o estado de issues no Linear.

Uso:
    python tools/update_linear_issue.py TRE-36
    python tools/update_linear_issue.py TRE-36 TRE-37 TRE-38
    python tools/update_linear_issue.py --state in_progress TRE-58

Valores para --state:
    done (padrão), in_progress, todo
"""

import os
import sys
import json
import pathlib
import requests

API_URL   = "https://api.linear.app/graphql"
TEAM_NAME = "Treinamento Físico"

# Carrega .env da raiz do projeto
_env_path = pathlib.Path(__file__).parent.parent / ".env"
if _env_path.exists():
    for _line in _env_path.read_text(encoding="utf-8").splitlines():
        _line = _line.strip()
        if _line and not _line.startswith("#") and "=" in _line:
            _k, _v = _line.split("=", 1)
            os.environ.setdefault(_k.strip(), _v.strip().strip('"').strip("'"))


def gql(api_key, query, variables=None):
    resp = requests.post(
        API_URL,
        headers={"Authorization": api_key, "Content-Type": "application/json"},
        json={"query": query, "variables": variables or {}},
        timeout=15,
    )
    resp.raise_for_status()
    data = resp.json()
    if "errors" in data:
        raise RuntimeError(json.dumps(data["errors"], indent=2))
    return data["data"]


def get_states(api_key, team_id):
    data = gql(api_key, """
    query($teamId: String!) {
        team(id: $teamId) {
            states {
                nodes { id name type }
            }
        }
    }
    """, {"teamId": team_id})
    return data["team"]["states"]["nodes"]


def pick_state_id(states, target):
    target = target.lower().strip()

    if target == "done":
      for s in states:
        if s["type"] == "completed":
            return s["id"]
      for s in states:
        if s["name"].lower() in ("done", "concluído", "concluido"):
            return s["id"]

    if target == "in_progress":
      for s in states:
        if s["type"] == "started":
            return s["id"]
      for s in states:
        if s["name"].lower() in ("in progress", "em andamento", "doing"):
            return s["id"]

    if target == "todo":
      for s in states:
        if s["type"] == "unstarted":
            return s["id"]
      for s in states:
        if s["name"].lower() in ("todo", "a fazer", "backlog"):
            return s["id"]

    available = [f"{s['name']} ({s['type']})" for s in states]
    raise ValueError(
        f"Estado '{target}' não encontrado. Estados disponíveis: {available}"
    )


def get_issue_id(api_key, identifier):
    data = gql(api_key, """
    query($identifier: String!) {
        issue(id: $identifier) { id identifier title }
    }
    """, {"identifier": identifier})
    return data["issue"]["id"]


def update_issue_state(api_key, issue_id, state_id):
    result = gql(api_key, """
    mutation($id: String!, $stateId: String!) {
        issueUpdate(id: $id, input: { stateId: $stateId }) {
            success
            issue { identifier title state { name } }
        }
    }
    """, {"id": issue_id, "stateId": state_id})
    return result["issueUpdate"]["issue"]


def main():
    api_key = os.environ.get("LINEAR_API_KEY", "").strip()
    if not api_key:
        print("Erro: LINEAR_API_KEY não definida.")
        sys.exit(1)

    state = "done"
    args = sys.argv[1:]
    if len(args) >= 2 and args[0] == "--state":
        state = args[1]
        args = args[2:]

    identifiers = args
    if not identifiers:
        print("Uso: python tools/update_linear_issue.py [--state done|in_progress|todo] TRE-36 [TRE-37 ...]")
        sys.exit(1)

    # Buscar team_id
    teams = {t["name"]: t["id"] for t in gql(api_key, "query { teams { nodes { id name } } }")["teams"]["nodes"]}
    if TEAM_NAME not in teams:
        print(f"Time '{TEAM_NAME}' não encontrado. Times: {list(teams.keys())}")
        sys.exit(1)
    team_id = teams[TEAM_NAME]

    states = get_states(api_key, team_id)
    state_id = pick_state_id(states, state)

    for identifier in identifiers:
        try:
            issue_id = get_issue_id(api_key, identifier)
            issue    = update_issue_state(api_key, issue_id, state_id)
            print(f"✓ {issue['identifier']} — {issue['title']}  →  {issue['state']['name']}")
        except Exception as e:
            print(f"✗ {identifier}: {e}")


if __name__ == "__main__":
    main()
