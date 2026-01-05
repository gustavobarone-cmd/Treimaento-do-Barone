# Pacote de dados — Treinos do Alberto (Ciclo II • Fase 3)

Este pacote contém:
- Biblioteca de exercícios (com IDs enumerados: ALB-0001, ALB-0002, ...)
- Sessões (Treino A e Treino B) com progressão semanal (* e **)
- Arquivo `index.json` para o app listar os treinos
- Template de `training_status.json` para você marcar qual semana está

## Onde colocar no seu projeto (recomendado)
Coloque a pasta `treinos/` dentro de `public/`:

public/
  treinos/
    index.json
    state/training_status.json
    exercises/alberto_exercises.json
    sessions/alberto_c2_f3_a.json
    sessions/alberto_c2_f3_b.json

## Como usar no app
1) Carregue `public/treinos/index.json` para listar os treinos
2) Quando abrir um treino, faça fetch do `path` (ex: `sessions/alberto_c2_f3_a.json`)
3) Leia `state/training_status.json` para aplicar a semana atual (9 a 16)

## Como continuar enumerando
- O arquivo `exercises/alberto_exercises.json` tem `nextExerciseNumber`.
- Quando você adicionar exercícios novos, continue a partir desse número para manter IDs únicos.
