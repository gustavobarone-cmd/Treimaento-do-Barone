import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client';

function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('pt-BR');
}

function downloadFile(filename, mime, content) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function shareOrDownload(filename, mime, content) {
  if (typeof navigator !== 'undefined' && navigator.canShare) {
    try {
      const file = new File([content], filename, { type: mime });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: filename });
        return;
      }
    } catch (e) {
      if (e.name === 'AbortError') return;
      // fall through to download
    }
  }
  downloadFile(filename, mime, content);
}

function toCsv(rows) {
  const header = [
    'session_id', 'session_started_at', 'data_hora', 'treino', 'bloco',
    'exercicio', 'serie', 'modo_alvo', 'reps_alvo', 'segundos_alvo',
    'reps_realizadas', 'carga_real_kg', 'observacao',
  ];
  const esc = (v) => {
    const s = v == null ? '' : String(v);
    if (s.includes(';') || s.includes('"') || s.includes('\n')) return `"${s.replaceAll('"', '""')}"`;
    return s;
  };
  const lines = rows.map((r) => [
    r.session_id, r.session_started_at, r.created_at, r.workout_name, r.block_name,
    r.exercise_name, r.set_number, r.target_mode, r.target_reps, r.target_seconds,
    r.performed_reps, r.performed_load_kg, r.notes,
  ].map(esc).join(';'));
  return [header.join(';'), ...lines].join('\n');
}

// ─── SVG sparkline ────────────────────────────────────────────────────────────
const SW = 560, SH = 150;
const PAD = { t: 14, r: 24, b: 32, l: 48 };
const CW = SW - PAD.l - PAD.r;
const CH = SH - PAD.t - PAD.b;

function ExerciseChart({ rows, metric }) {
  const points = useMemo(() => {
    const byDate = new Map();
    [...rows]
      .sort((a, b) => (a.created_at || '') < (b.created_at || '') ? -1 : 1)
      .forEach((r) => {
        const day = (r.created_at || '').slice(0, 10);
        const val = metric === 'load' ? Number(r.performed_load_kg) : Number(r.performed_reps);
        if (!day || !Number.isFinite(val) || val <= 0) return;
        if (!byDate.has(day)) byDate.set(day, []);
        byDate.get(day).push(val);
      });
    return [...byDate.entries()].map(([day, vals]) => ({
      day,
      val: vals.reduce((a, b) => a + b, 0) / vals.length,
    }));
  }, [rows, metric]);

  if (points.length < 2) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--text2)', padding: '12px 0', fontSize: 13 }}>
        Dados insuficientes — registre ao menos 2 sessões com esse exercício.
      </div>
    );
  }

  const vals  = points.map((p) => p.val);
  const minV  = Math.min(...vals);
  const maxV  = Math.max(...vals);
  const range = maxV - minV || 1;

  const toX = (i) => PAD.l + (i / (points.length - 1)) * CW;
  const toY = (v) => PAD.t + CH - ((v - minV) / range) * CH;

  const polyline = points.map((p, i) => `${toX(i).toFixed(1)},${toY(p.val).toFixed(1)}`).join(' ');

  const yTicks = [minV, (minV + maxV) / 2, maxV];
  const xIdxs  = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])];

  return (
    <svg
      viewBox={`0 0 ${SW} ${SH}`}
      style={{ width: '100%', maxWidth: SW, display: 'block' }}
      aria-label="Gráfico de evolução"
    >
      {yTicks.map((v, i) => (
        <line key={i} x1={PAD.l} x2={SW - PAD.r} y1={toY(v)} y2={toY(v)}
          stroke="var(--border, #334155)" strokeWidth="0.6" strokeDasharray="4 3" />
      ))}
      <line x1={PAD.l} x2={PAD.l} y1={PAD.t} y2={SH - PAD.b} stroke="var(--text2, #94a3b8)" strokeWidth="1" />
      <line x1={PAD.l} x2={SW - PAD.r} y1={SH - PAD.b} y2={SH - PAD.b} stroke="var(--text2, #94a3b8)" strokeWidth="1" />
      {yTicks.map((v, i) => (
        <text key={i} x={PAD.l - 5} y={toY(v) + 4} textAnchor="end" fontSize="10" fill="var(--text2, #94a3b8)">
          {v.toFixed(1)}
        </text>
      ))}
      {xIdxs.map((i) => (
        <text key={i} x={toX(i)} y={SH - PAD.b + 14} textAnchor="middle" fontSize="10" fill="var(--text2, #94a3b8)">
          {points[i].day.slice(5)}
        </text>
      ))}
      <polyline points={polyline} fill="none" stroke="var(--accent, #6366f1)" strokeWidth="2.5" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={toX(i)} cy={toY(p.val)} r="3.5" fill="var(--accent, #6366f1)" />
      ))}
    </svg>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function StudentHistory() {
  const { id } = useParams();

  const [student, setStudent]         = useState(null);
  const [workouts, setWorkouts]       = useState([]);
  const [workoutId, setWorkoutId]     = useState('');
  const [dateFrom, setDateFrom]       = useState('');
  const [dateTo, setDateTo]           = useState('');
  const [rows, setRows]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [chartExercise, setChartExercise] = useState('');
  const [chartMetric, setChartMetric] = useState('load');

  useEffect(() => {
    Promise.all([api.getStudent(id), api.getWorkouts(id)])
      .then(([s, w]) => { setStudent(s); setWorkouts(w); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const params = { limit: 1000 };
    if (workoutId) params.workoutId = workoutId;
    if (dateFrom)  params.from      = dateFrom;
    if (dateTo)    params.to        = dateTo;

    api.getStudentHistory(id, params)
      .then((data) => {
        setRows(data);
        if (!chartExercise && data.length > 0) {
          const counts = {};
          data.forEach((r) => { if (r.exercise_name) counts[r.exercise_name] = (counts[r.exercise_name] || 0) + 1; });
          const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
          if (top) setChartExercise(top[0]);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, workoutId, dateFrom, dateTo]);

  const summary = useMemo(() => {
    const sessions = new Set(rows.map((r) => r.session_id || `${r.workout_id}|${r.created_at?.slice(0, 10)}`)).size;
    const totalSets = rows.length;
    const loads = rows.map((r) => Number(r.performed_load_kg)).filter((n) => Number.isFinite(n) && n > 0);
    const avg = loads.length ? (loads.reduce((a, b) => a + b, 0) / loads.length).toFixed(1) : '-';
    return { sessions, totalSets, avgLoad: avg };
  }, [rows]);

  const exerciseNames = useMemo(() =>
    [...new Set(rows.map((r) => r.exercise_name).filter(Boolean))].sort()
  , [rows]);

  const chartRows = useMemo(() =>
    chartExercise ? rows.filter((r) => r.exercise_name === chartExercise) : []
  , [rows, chartExercise]);

  function exportJson() {
    const content = JSON.stringify(rows, null, 2);
    const name = `historico_${student?.name || 'aluno'}_${new Date().toISOString().slice(0, 10)}.json`;
    downloadFile(name, 'application/json;charset=utf-8', content);
  }

  async function exportCsv() {
    const content = toCsv(rows);
    const name = `historico_${student?.name || 'aluno'}_${new Date().toISOString().slice(0, 10)}.csv`;
    await shareOrDownload(name, 'text/csv;charset=utf-8', content);
  }

  if (loading) return <div className="loading">Carregando histórico...</div>;
  if (error)   return <div className="error-msg">{error}</div>;

  return (
    <>
      <Link to={`/students/${id}`} className="back-link">← Voltar ao aluno</Link>

      {/* Filtros + exportação */}
      <div className="card">
        <div className="card-header">
          <h2>Histórico de Execução</h2>
          <span className="badge badge-active">{student?.name || 'Aluno'}</span>
        </div>

        <div className="form-row" style={{ marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div className="form-group">
            <label>
              Treino
              <select value={workoutId} onChange={(e) => setWorkoutId(e.target.value)}>
                <option value="">Todos</option>
                {workouts.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </label>
          </div>
          <div className="form-group">
            <label>
              De
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </label>
          </div>
          <div className="form-group">
            <label>
              Até
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </label>
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-secondary" onClick={exportCsv} disabled={rows.length === 0}>
              Exportar / Compartilhar CSV
            </button>
            <button type="button" className="btn btn-secondary" onClick={exportJson} disabled={rows.length === 0}>
              Exportar JSON
            </button>
          </div>
        </div>

        {/* Resumo */}
        <div className="form-row" style={{ marginBottom: 0, flexWrap: 'wrap', gap: 8 }}>
          <div className="card" style={{ marginBottom: 0, minWidth: 90 }}>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>Sessões</div>
            <div style={{ fontWeight: 700, fontSize: 20 }}>{summary.sessions}</div>
          </div>
          <div className="card" style={{ marginBottom: 0, minWidth: 90 }}>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>Séries</div>
            <div style={{ fontWeight: 700, fontSize: 20 }}>{summary.totalSets}</div>
          </div>
          <div className="card" style={{ marginBottom: 0, minWidth: 90 }}>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>Carga média (kg)</div>
            <div style={{ fontWeight: 700, fontSize: 20 }}>{summary.avgLoad}</div>
          </div>
        </div>
      </div>

      {/* Gráfico de evolução */}
      {exerciseNames.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2>Evolução por exercício</h2>
          </div>
          <div className="form-row" style={{ marginBottom: 12 }}>
            <div className="form-group">
              <label>
                Exercício
                <select value={chartExercise} onChange={(e) => setChartExercise(e.target.value)}>
                  <option value="">Selecionar...</option>
                  {exerciseNames.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
            </div>
            <div className="form-group">
              <label>
                Métrica
                <select value={chartMetric} onChange={(e) => setChartMetric(e.target.value)}>
                  <option value="load">Carga (kg)</option>
                  <option value="reps">Repetições</option>
                </select>
              </label>
            </div>
          </div>
          {chartExercise && <ExerciseChart rows={chartRows} metric={chartMetric} />}
        </div>
      )}

      {/* Lista de registros */}
      <div className="card">
        <div className="card-header">
          <h2>Registros</h2>
          <span className="badge badge-inactive">{rows.length}</span>
        </div>

        {rows.length === 0 ? (
          <div className="empty" style={{ padding: '20px 0' }}>Nenhum registro encontrado.</div>
        ) : (
          rows.map((r, idx) => (
            <div key={`${r.id}-${idx}`} className="period-row">
              <div style={{ flex: 1 }}>
                <div className="period-name">{r.exercise_name} · série {r.set_number}</div>
                <div className="period-dates">{r.workout_name} · {r.block_name}</div>
                <div className="period-obj">
                  Alvo: {r.target_mode === 'series' ? `${r.target_reps || '-'} reps` : `${r.target_seconds || '-'} s`} ·
                  Real: {r.performed_reps ?? '-'} reps · {r.performed_load_kg ?? '-'} kg
                </div>
                {r.notes && <div className="period-obj">Obs: {r.notes}</div>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text2)', whiteSpace: 'nowrap' }}>
                {formatDateTime(r.created_at)}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
