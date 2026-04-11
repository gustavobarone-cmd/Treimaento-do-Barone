"""
Cria épicos e issues no Linear para o projeto "Personal Trainer App"
no time "Treinamento Físico".

Uso:
    set LINEAR_API_KEY=lin_api_SEU_TOKEN
    python tools/create_linear_issues.py

Dependências:
    pip install requests
"""

import os
import sys
import json
import time
import pathlib
import requests

# Carrega .env da raiz do projeto (pasta acima de /tools)
_env_path = pathlib.Path(__file__).parent.parent / ".env"
if _env_path.exists():
    for _line in _env_path.read_text(encoding="utf-8").splitlines():
        _line = _line.strip()
        if _line and not _line.startswith("#") and "=" in _line:
            _k, _v = _line.split("=", 1)
            _v = _v.strip().strip('"').strip("'")
            os.environ.setdefault(_k.strip(), _v)

# ─── Config ───────────────────────────────────────────────────────────────────

API_URL = "https://api.linear.app/graphql"
TEAM_NAME = "Treinamento Físico"

# ─── Issues ───────────────────────────────────────────────────────────────────

EPICS_AND_ISSUES = [
    {
        "epic": "Gestão de Alunos e Períodos",
        "issues": [
            "Criar cadastro de alunos (nome, foto/avatar, observações)",
            "Criar conceito de 'Período de treinamento' (data início, data fim, objetivo)",
            "Tela do personal: lista de alunos com período ativo",
        ],
    },
    {
        "epic": "Montagem do Treino pelo Personal",
        "issues": [
            "Criar/editar treino para um aluno em um período",
            "Escolher modo do treino: por séries+repetições ou por tempo de execução",
            "Criar blocos de exercícios (ex.: Triset, Biset, Série simples)",
            "Adicionar exercício ao bloco com: nome, séries, reps (ou tempo), carga",
            "Vincular vídeo YouTube a cada exercício",
            "Reordenar blocos e exercícios via drag-and-drop",
            "Mostrar tempo estimado do treino em tempo real enquanto o personal monta",
        ],
    },
    {
        "epic": "Mobilidade e Alongamento Integrados",
        "issues": [
            "Reutilizar banco de alongamentos existente (146 itens) e banco de mobilidade",
            "Personal configura rotina de Mobilidade/Aquecimento pré-treino para o aluno",
            "Personal configura rotina de Alongamento relaxamento pós-treino",
            "Tempo estimado inclui tempo do pré e pós no cálculo total",
        ],
    },
    {
        "epic": "Execução do Treino pelo Aluno",
        "issues": [
            "Tela do aluno: abrir treino do dia",
            "Fluxo guiado: Mobilidade pré → Blocos de treino → Alongamento pós",
            "Exibir nome do exercício + vídeo em loop enquanto aluno executa",
            "Modo séries: aluno toca 'Concluí a série' a cada série; app marca e avança",
            "Modo tempo: timer conta execução; ao fim app avisa e avança automaticamente",
            "App informa fim do bloco ('Bloco concluído! Próximo: ...') com beep/voz",
            "App informa descanso entre séries/blocos com timer regressivo",
            "Aluno pode registrar carga realizada e observação por série",
        ],
    },
    {
        "epic": "Histórico e Relatórios",
        "issues": [
            "Salvar log de cada treino executado (data, exercício, série, carga, reps)",
            "Tela do personal: ver histórico de treinos do aluno",
            "Exportar histórico em JSON ou CSV",
        ],
    },
    {
        "epic": "Infraestrutura e PWA",
        "issues": [
            "Migrar dados do localStorage para estrutura multi-aluno",
            "Manter PWA (manifest + service worker) para uso offline",
            "Banco de exercícios editável pelo personal com vídeo",
        ],
    },
]

# ─── GraphQL helpers ──────────────────────────────────────────────────────────

def gql(api_key: str, query: str, variables: dict = None):
    headers = {
        "Authorization": api_key,
        "Content-Type": "application/json",
    }
    payload = {"query": query}
    if variables:
        payload["variables"] = variables

    resp = requests.post(API_URL, headers=headers, json=payload, timeout=15)
    resp.raise_for_status()
    data = resp.json()

    if "errors" in data:
        raise RuntimeError(f"GraphQL error: {json.dumps(data['errors'], indent=2)}")
    return data["data"]


def get_team_id(api_key: str, team_name: str) -> str:
    query = """
    query {
        teams {
            nodes { id name }
        }
    }
    """
    data = gql(api_key, query)
    teams = data["teams"]["nodes"]
    for t in teams:
        if t["name"].strip().lower() == team_name.strip().lower():
            return t["id"]

    print("\nTimes disponíveis na sua org:")
    for t in teams:
        print(f"  - {t['name']}")
    raise ValueError(
        f"Time '{team_name}' não encontrado. Verifique o nome acima e ajuste TEAM_NAME no script."
    )


def create_issue(api_key: str, team_id: str, title: str, parent_id: str = None) -> str:
    mutation = """
    mutation CreateIssue($input: IssueCreateInput!) {
        issueCreate(input: $input) {
            success
            issue { id identifier title }
        }
    }
    """
    variables = {
        "input": {
            "teamId": team_id,
            "title": title,
        }
    }
    if parent_id:
        variables["input"]["parentId"] = parent_id

    data = gql(api_key, mutation, variables)
    issue = data["issueCreate"]["issue"]
    return issue["id"], issue["identifier"]


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    api_key = os.environ.get("LINEAR_API_KEY", "").strip()
    if not api_key:
        print("Erro: defina a variável de ambiente LINEAR_API_KEY antes de rodar.")
        print("  Windows: set LINEAR_API_KEY=lin_api_SEU_TOKEN")
        print("  Linux/Mac: export LINEAR_API_KEY=lin_api_SEU_TOKEN")
        sys.exit(1)

    print(f"Conectando ao Linear... buscando time '{TEAM_NAME}'")
    team_id = get_team_id(api_key, TEAM_NAME)
    print(f"Time encontrado: {team_id}\n")

    total_issues = 0

    for group in EPICS_AND_ISSUES:
        epic_title = group["epic"]
        print(f"📌 Criando épico: {epic_title}")
        epic_id, epic_ref = create_issue(api_key, team_id, epic_title)
        print(f"   → {epic_ref} criado")
        time.sleep(0.4)  # respeita rate limit

        for issue_title in group["issues"]:
            _, issue_ref = create_issue(api_key, team_id, issue_title, parent_id=epic_id)
            print(f"      ✓ {issue_ref} — {issue_title}")
            total_issues += 1
            time.sleep(0.4)

        print()

    print(f"Concluído! {len(EPICS_AND_ISSUES)} épicos e {total_issues} issues criados no time '{TEAM_NAME}'.")


if __name__ == "__main__":
    main()
