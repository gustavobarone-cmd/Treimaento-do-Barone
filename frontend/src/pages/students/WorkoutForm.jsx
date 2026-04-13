import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';

const AVG_SECONDS_PER_REP = 4;

function toNum(v, fallback = 0) {
  if (v === '' || v == null) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function estimateItemSeconds(item) {
  const mode = item.prescription_mode === 'tempo' ? 'tempo' : 'series';
  const restAfter = toNum(item.rest_after_sec, 0);

  if (mode === 'tempo') {
    const sets = Math.max(1, toNum(item.sets, 1));
    const seconds = Math.max(0, toNum(item.seconds, 0));
    return (seconds + restAfter) * sets;
  }

  const sets = Math.max(1, toNum(item.sets, 1));
  const reps = Math.max(0, toNum(item.reps, 0));
  const execution = reps * AVG_SECONDS_PER_REP;
  return (execution + restAfter) * sets;
}

function estimateBlockSeconds(block) {
  const items = Array.isArray(block.items) ? block.items : [];
  const base = items.reduce((acc, item) => {
    if (!(item.exercise_name || '').trim()) return acc;
    return acc + estimateItemSeconds(item);
  }, 0);

  const restBetween = Math.max(0, toNum(block.rest_between_exercises_sec, 0));
  const transitions = Math.max(0, items.filter((it) => (it.exercise_name || '').trim()).length - 1);
  return base + (restBetween * transitions);
}

function formatSeconds(totalSeconds) {
  const sec = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}

function moveInArray(arr, from, to) {
  if (to < 0 || to >= arr.length || from === to) return arr;
  const clone = [...arr];
  const [item] = clone.splice(from, 1);
  clone.splice(to, 0, item);
  return clone;
}

// ── Componente de seleção de mobilidade / alongamento ──────────────────────
function MobilitySection({ phase, title, items, bank, query, onQueryChange, onAdd, onRemove, onMove, totalSec }) {
  const [open, setOpen] = useState(false);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  const label = totalSec > 0
    ? (mins > 0 ? `${mins}m ${String(secs).padStart(2, '0')}s` : `${secs}s`)
    : '0s';

  return (
    <div className="card" style={{ marginTop: 12 }}>
      <div className="card-header">
        <h2 style={{ fontSize: 15 }}>{title}</h2>
        <span className="badge badge-inactive">{label} · {items.length} exerc.</span>
      </div>

      {/* Lista selecionada */}
      {items.length === 0 ? (
        <div className="empty" style={{ padding: '10px 0', fontSize: 13 }}>Nenhum exercício adicionado.</div>
      ) : (
        items.map((m, idx) => (
          <div key={m.bank_item_id} className="period-row" style={{ paddingTop: 6, paddingBottom: 6 }}>
            <div style={{ flex: 1 }}>
              <div className="period-name" style={{ fontSize: 14 }}>{m.name_pt}</div>
              {m.region && <div className="period-dates">{m.region} · {m.default_duration_s}s</div>}
              {m.cue && <div className="period-obj" style={{ fontStyle: 'italic' }}>{m.cue}</div>}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => onMove(idx, -1)} disabled={idx === 0}>↑</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => onMove(idx, 1)} disabled={idx === items.length - 1}>↓</button>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => onRemove(m.bank_item_id)}>✕</button>
            </div>
          </div>
        ))
      )}

      {/* Buscador do banco */}
      <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: 8 }} onClick={() => setOpen((o) => !o)}>
        {open ? '▲ Fechar banco' : '▼ Adicionar do banco'}
      </button>

      {open && (
        <div style={{ marginTop: 8 }}>
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Buscar exercício..."
            style={{ marginBottom: 8 }}
          />
          <div style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {bank.slice(0, 80).map((item) => {
              const already = items.find((m) => m.bank_item_id === item.id);
              return (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{item.name_pt}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>{item.region} · {item.default_duration_s}s · {item.style}</div>
                  </div>
                  <button
                    type="button"
                    className={already ? 'btn btn-secondary btn-sm' : 'btn btn-primary btn-sm'}
                    onClick={() => onAdd(item)}
                    disabled={!!already}
                  >
                    {already ? '✓' : '+'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkoutForm() {
  const { id: studentId, workoutId } = useParams();
  const navigate = useNavigate();
  const api = useApi();
  const isEdit = Boolean(workoutId);

  const [periods, setPeriods]         = useState([]);
  const [bankPre, setBankPre]         = useState([]);
  const [bankPost, setBankPost]       = useState([]);
  const [bankQuery, setBankQuery]     = useState({ pre: '', post: '' });
  const [mobilityPre, setMobilityPre]   = useState([]);   // exercícios selecionados pré
  const [mobilityPost, setMobilityPost] = useState([]);   // exercícios selecionados pós
  const [form, setForm] = useState({
    name: '',
    mode: 'series',
    training_period_id: '',
    notes: '',
    blocks: [
      {
        name: 'Bloco 1',
        type: 'simples',
        rest_between_exercises_sec: 0,
        items: [
          {
            exercise_name: '',
            prescription_mode: 'series',
            sets: 3,
            reps: 10,
            seconds: '',
            load_kg: '',
            youtube_url: '',
            rest_after_sec: 60,
            notes: '',
          },
        ],
      },
    ],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadBank = Promise.all([
      api.getMobilityBank('pre'),
      api.getMobilityBank('post'),
    ]);
    const loadForm = Promise.all([
      api.getPeriods(studentId),
      isEdit ? api.getWorkout(studentId, workoutId) : Promise.resolve(null),
      isEdit ? api.getWorkoutMobility(studentId, workoutId) : Promise.resolve([]),
    ]);

    Promise.all([loadBank, loadForm])
      .then(([[bPre, bPost], [p, w, mob]]) => {
        setBankPre(bPre);
        setBankPost(bPost);
        setPeriods(p);

        if (mob && mob.length) {
          setMobilityPre(mob.filter((m) => m.phase === 'pre'));
          setMobilityPost(mob.filter((m) => m.phase === 'post'));
        }

        if (w) {
          setForm({
            name: w.name,
            mode: w.mode,
            training_period_id: w.training_period_id || '',
            notes: w.notes || '',
            blocks: Array.isArray(w.blocks) && w.blocks.length
              ? w.blocks.map((b) => ({
                  name: b.name,
                  type: b.type,
                  rest_between_exercises_sec: b.rest_between_exercises_sec ?? 0,
                  items: (b.items || []).map((it) => ({
                    exercise_name: it.exercise_name || '',
                    prescription_mode: it.prescription_mode || 'series',
                    sets: it.sets ?? '',
                    reps: it.reps ?? '',
                    seconds: it.seconds ?? '',
                    load_kg: it.load_kg ?? '',
                    youtube_url: it.youtube_url || '',
                    rest_after_sec: it.rest_after_sec ?? 0,
                    notes: it.notes || '',
                  })),
                }))
              : [],
          });
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [studentId, workoutId, isEdit]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const setWorkoutMode = (e) => {
    const mode = e.target.value;
    setForm((prev) => ({
      ...prev,
      mode,
      blocks: prev.blocks.map((b) => ({
        ...b,
        items: (b.items || []).map((it) => {
          if (mode === 'series') {
            return {
              ...it,
              prescription_mode: 'series',
              sets: it.sets === '' || it.sets == null ? 3 : it.sets,
              reps: it.reps === '' || it.reps == null ? 10 : it.reps,
            };
          }
          return {
            ...it,
            prescription_mode: 'tempo',
            seconds: it.seconds === '' || it.seconds == null ? 30 : it.seconds,
          };
        }),
      })),
    }));
  };

  const setBlockField = (blockIdx, field) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b, i) => (i === blockIdx ? { ...b, [field]: value } : b)),
    }));
  };

  const setItemField = (blockIdx, itemIdx, field) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b, bi) => {
        if (bi !== blockIdx) return b;
        return {
          ...b,
          items: b.items.map((it, ii) => (ii === itemIdx ? { ...it, [field]: value } : it)),
        };
      }),
    }));
  };

  function addBlock() {
    setForm((prev) => ({
      ...prev,
      blocks: [
        ...prev.blocks,
        {
          name: `Bloco ${prev.blocks.length + 1}`,
          type: 'simples',
          rest_between_exercises_sec: 0,
          items: [
            {
              exercise_name: '',
              prescription_mode: prev.mode,
              sets: prev.mode === 'series' ? 3 : '',
              reps: prev.mode === 'series' ? 10 : '',
              seconds: prev.mode === 'tempo' ? 30 : '',
              load_kg: '',
              youtube_url: '',
              rest_after_sec: 60,
              notes: '',
            },
          ],
        },
      ],
    }));
  }

  function removeBlock(blockIdx) {
    setForm((prev) => ({ ...prev, blocks: prev.blocks.filter((_, i) => i !== blockIdx) }));
  }

  function moveBlock(blockIdx, direction) {
    setForm((prev) => ({
      ...prev,
      blocks: moveInArray(prev.blocks, blockIdx, blockIdx + direction),
    }));
  }

  function addItem(blockIdx) {
    setForm((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b, i) => {
        if (i !== blockIdx) return b;
        return {
          ...b,
          items: [
            ...b.items,
            {
              exercise_name: '',
              prescription_mode: prev.mode,
              sets: prev.mode === 'series' ? 3 : '',
              reps: prev.mode === 'series' ? 10 : '',
              seconds: prev.mode === 'tempo' ? 30 : '',
              load_kg: '',
              youtube_url: '',
              rest_after_sec: 60,
              notes: '',
            },
          ],
        };
      }),
    }));
  }

  function removeItem(blockIdx, itemIdx) {
    setForm((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b, i) => {
        if (i !== blockIdx) return b;
        return { ...b, items: b.items.filter((_, ii) => ii !== itemIdx) };
      }),
    }));
  }

  function moveItem(blockIdx, itemIdx, direction) {
    setForm((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b, i) => {
        if (i !== blockIdx) return b;
        return { ...b, items: moveInArray(b.items, itemIdx, itemIdx + direction) };
      }),
    }));
  }

  function normalizeBlocks(blocks) {
    return (blocks || []).map((b) => ({
      name: (b.name || '').trim() || 'Bloco',
      type: b.type || 'simples',
      rest_between_exercises_sec: Number(b.rest_between_exercises_sec || 0),
      items: (b.items || [])
        .filter((it) => (it.exercise_name || '').trim())
        .map((it) => ({
          exercise_name: it.exercise_name.trim(),
          prescription_mode: it.prescription_mode === 'tempo' ? 'tempo' : 'series',
          sets: it.sets === '' ? null : Number(it.sets),
          reps: it.reps === '' ? null : Number(it.reps),
          seconds: it.seconds === '' ? null : Number(it.seconds),
          load_kg: it.load_kg === '' ? null : Number(it.load_kg),
          youtube_url: (it.youtube_url || '').trim() || null,
          rest_after_sec: Number(it.rest_after_sec || 0),
          notes: (it.notes || '').trim() || null,
        })),
    }));
  }

  // ── helpers de mobilidade pré/pós ────────────────────────────────
  const filteredBankPre = useMemo(() => {
    const q = bankQuery.pre.toLowerCase();
    return q ? bankPre.filter((i) => i.name_pt.toLowerCase().includes(q) || (i.region || '').toLowerCase().includes(q)) : bankPre;
  }, [bankPre, bankQuery.pre]);

  const filteredBankPost = useMemo(() => {
    const q = bankQuery.post.toLowerCase();
    return q ? bankPost.filter((i) => i.name_pt.toLowerCase().includes(q) || (i.region || '').toLowerCase().includes(q)) : bankPost;
  }, [bankPost, bankQuery.post]);

  function addMobilityItem(phase, item) {
    const entry = {
      bank_item_id:       item.id,
      name_pt:            item.name_pt,
      region:             item.region || null,
      default_duration_s: item.default_duration_s,
      cue:                item.cue || null,
      youtube_id:         item.youtube_id || null,
    };
    if (phase === 'pre') {
      if (mobilityPre.find((m) => m.bank_item_id === item.id)) return;
      setMobilityPre((prev) => [...prev, entry]);
    } else {
      if (mobilityPost.find((m) => m.bank_item_id === item.id)) return;
      setMobilityPost((prev) => [...prev, entry]);
    }
  }

  function removeMobilityItem(phase, bankItemId) {
    if (phase === 'pre') setMobilityPre((prev) => prev.filter((m) => m.bank_item_id !== bankItemId));
    else setMobilityPost((prev) => prev.filter((m) => m.bank_item_id !== bankItemId));
  }

  function moveMobilityItem(phase, idx, dir) {
    const setter = phase === 'pre' ? setMobilityPre : setMobilityPost;
    setter((prev) => moveInArray(prev, idx, idx + dir));
  }

  const preTotalSec  = mobilityPre.reduce((s, m) => s + Number(m.default_duration_s || 30), 0);
  const postTotalSec = mobilityPost.reduce((s, m) => s + Number(m.default_duration_s || 30), 0);

  // ── estimativa total ─────────────────────────────────────────────
  const estimatedByBlock = form.blocks.map((b, idx) => ({
    index: idx,
    name: (b.name || `Bloco ${idx + 1}`).trim(),
    seconds: estimateBlockSeconds(b),
  }));
  const estimatedTotalSeconds = preTotalSec + estimatedByBlock.reduce((acc, b) => acc + b.seconds, 0) + postTotalSec;

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        ...form,
        training_period_id: form.training_period_id || null,
        pre_mobility_sec:   preTotalSec,
        post_stretch_sec:   postTotalSec,
        blocks: normalizeBlocks(form.blocks),
      };

      let savedId = workoutId;
      if (isEdit) {
        await api.updateWorkout(studentId, workoutId, payload);
      } else {
        const created = await api.createWorkout(studentId, payload);
        savedId = created.id;
      }

      await api.saveWorkoutMobility(studentId, savedId, {
        pre:  mobilityPre,
        post: mobilityPost,
      });

      navigate(`/students/${studentId}`);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  if (loading) return <div className="loading">Carregando...</div>;

  return (
    <>
      <Link to={`/students/${studentId}`} className="back-link">← Voltar ao aluno</Link>

      <div className="card">
        <div className="card-header">
          <h2>{isEdit ? 'Editar Treino' : 'Novo Treino'}</h2>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              Nome do treino *
              <input
                value={form.name}
                onChange={set('name')}
                required
                placeholder="Ex: Treino A - Superiores"
              />
            </label>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                Modo de execução *
                <select value={form.mode} onChange={setWorkoutMode} required>
                  <option value="series">Por séries/repetições</option>
                  <option value="tempo">Por tempo de execução</option>
                </select>
              </label>
            </div>
            <div className="form-group">
              <label>
                Período
                <select value={form.training_period_id} onChange={set('training_period_id')}>
                  <option value="">Sem vínculo</option>
                  {periods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                Observações
                <textarea
                  rows={4}
                  value={form.notes}
                  onChange={set('notes')}
                  placeholder="Objetivo do treino, observações do personal, etc."
                />
              </label>
            </div>
          </div>

          {/* ── Mobilidade pré-treino ─────────────────────────── */}
          <MobilitySection
            phase="pre"
            title="Mobilidade / Aquecimento pré-treino"
            items={mobilityPre}
            bank={filteredBankPre}
            query={bankQuery.pre}
            onQueryChange={(v) => setBankQuery((q) => ({ ...q, pre: v }))}
            onAdd={(item) => addMobilityItem('pre', item)}
            onRemove={(id) => removeMobilityItem('pre', id)}
            onMove={(idx, dir) => moveMobilityItem('pre', idx, dir)}
            totalSec={preTotalSec}
          />

          {/* ── Alongamento pós-treino ────────────────────────── */}
          <MobilitySection
            phase="post"
            title="Alongamento / Relaxamento pós-treino"
            items={mobilityPost}
            bank={filteredBankPost}
            query={bankQuery.post}
            onQueryChange={(v) => setBankQuery((q) => ({ ...q, post: v }))}
            onAdd={(item) => addMobilityItem('post', item)}
            onRemove={(id) => removeMobilityItem('post', id)}
            onMove={(idx, dir) => moveMobilityItem('post', idx, dir)}
            totalSec={postTotalSec}
          />

          <div className="card" style={{ marginTop: 8, marginBottom: 12 }}>
            <div className="card-header" style={{ marginBottom: 8 }}>
              <h2>Tempo estimado do treino</h2>
              <span className="badge badge-active">{formatSeconds(estimatedTotalSeconds)}</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>
              Cálculo automático com execução + descansos por exercício e por bloco.
            </div>
            <div style={{ marginTop: 10, display: 'grid', gap: 6 }}>
              {estimatedByBlock.map((b) => (
                <div key={b.index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span>{b.name}</span>
                  <strong>{formatSeconds(b.seconds)}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ marginTop: 8 }}>
            <div className="card-header">
              <h2>Blocos do treino</h2>
              <button type="button" className="btn btn-secondary btn-sm" onClick={addBlock}>+ Bloco</button>
            </div>

            {form.blocks.length === 0 ? (
              <div className="empty" style={{ padding: '20px 0' }}>
                Nenhum bloco adicionado.
              </div>
            ) : (
              form.blocks.map((block, blockIdx) => (
                <div key={blockIdx} className="card" style={{ background: 'var(--bg3)', marginBottom: 10 }}>
                  <div className="card-header" style={{ marginBottom: 10 }}>
                    <h2 style={{ fontSize: 15 }}>Bloco {blockIdx + 1}</h2>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => moveBlock(blockIdx, -1)}
                        disabled={blockIdx === 0}
                        title="Subir bloco"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => moveBlock(blockIdx, 1)}
                        disabled={blockIdx === form.blocks.length - 1}
                        title="Descer bloco"
                      >
                        ↓
                      </button>
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => removeBlock(blockIdx)}>
                        Remover bloco
                      </button>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>
                        Nome do bloco
                        <input value={block.name} onChange={setBlockField(blockIdx, 'name')} />
                      </label>
                    </div>
                    <div className="form-group">
                      <label>
                        Tipo
                        <select value={block.type} onChange={setBlockField(blockIdx, 'type')}>
                          <option value="simples">Simples</option>
                          <option value="biset">Biset</option>
                          <option value="triset">Triset</option>
                          <option value="circuito">Circuito</option>
                        </select>
                      </label>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>
                      Descanso entre exercícios do bloco (segundos)
                      <input
                        type="number"
                        min="0"
                        value={block.rest_between_exercises_sec}
                        onChange={setBlockField(blockIdx, 'rest_between_exercises_sec')}
                      />
                    </label>
                  </div>

                  <div className="card" style={{ background: 'var(--bg2)' }}>
                    <div className="card-header" style={{ marginBottom: 10 }}>
                      <h2 style={{ fontSize: 15 }}>Exercícios</h2>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => addItem(blockIdx)}>
                        + Exercício
                      </button>
                    </div>

                    {block.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="card" style={{ marginBottom: 10 }}>
                        <div className="card-header" style={{ marginBottom: 10 }}>
                          <h2 style={{ fontSize: 14 }}>Exercício {itemIdx + 1}</h2>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => moveItem(blockIdx, itemIdx, -1)}
                              disabled={itemIdx === 0}
                              title="Subir exercício"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => moveItem(blockIdx, itemIdx, 1)}
                              disabled={itemIdx === block.items.length - 1}
                              title="Descer exercício"
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => removeItem(blockIdx, itemIdx)}
                              disabled={block.items.length <= 1}
                            >
                              Remover
                            </button>
                          </div>
                        </div>

                        <div className="form-group">
                          <label>
                            Nome do exercício *
                            <input
                              value={item.exercise_name}
                              onChange={setItemField(blockIdx, itemIdx, 'exercise_name')}
                              placeholder="Ex: Agachamento livre"
                            />
                          </label>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>
                              Execução
                              <select
                                value={item.prescription_mode}
                                onChange={setItemField(blockIdx, itemIdx, 'prescription_mode')}
                                disabled
                              >
                                <option value="series">Séries/repetições</option>
                                <option value="tempo">Tempo</option>
                              </select>
                            </label>
                          </div>
                          <div className="form-group">
                            <label>
                              Carga (kg)
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                value={item.load_kg}
                                onChange={setItemField(blockIdx, itemIdx, 'load_kg')}
                                placeholder="Ex: 20"
                              />
                            </label>
                          </div>
                          <div className="form-group">
                            <label>
                              Vídeo do exercício (YouTube URL)
                              <input
                                value={item.youtube_url}
                                onChange={setItemField(blockIdx, itemIdx, 'youtube_url')}
                                placeholder="https://www.youtube.com/watch?v=..."
                              />
                            </label>
                          </div>
                        </div>

                        {(item.youtube_url || '').trim() && (
                          <div style={{ marginBottom: 10 }}>
                            <a
                              href={item.youtube_url}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-secondary btn-sm"
                              style={{ display: 'inline-flex' }}
                            >
                              Abrir vídeo
                            </a>
                          </div>
                        )}

                        {item.prescription_mode === 'series' ? (
                          <div className="form-row">
                            <div className="form-group">
                              <label>
                                Séries
                                <input
                                  type="number"
                                  min="1"
                                  value={item.sets}
                                  onChange={setItemField(blockIdx, itemIdx, 'sets')}
                                />
                              </label>
                            </div>
                            <div className="form-group">
                              <label>
                                Repetições
                                <input
                                  type="number"
                                  min="1"
                                  value={item.reps}
                                  onChange={setItemField(blockIdx, itemIdx, 'reps')}
                                />
                              </label>
                            </div>
                          </div>
                        ) : (
                          <div className="form-group">
                            <label>
                              Tempo de execução (segundos)
                              <input
                                type="number"
                                min="1"
                                value={item.seconds}
                                onChange={setItemField(blockIdx, itemIdx, 'seconds')}
                              />
                            </label>
                          </div>
                        )}

                        <div className="form-row">
                          <div className="form-group">
                            <label>
                              Descanso após exercício (segundos)
                              <input
                                type="number"
                                min="0"
                                value={item.rest_after_sec}
                                onChange={setItemField(blockIdx, itemIdx, 'rest_after_sec')}
                              />
                            </label>
                          </div>
                          <div className="form-group">
                            <label>
                              Observações
                              <input
                                value={item.notes}
                                onChange={setItemField(blockIdx, itemIdx, 'notes')}
                                placeholder="Ex: controlar postura"
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Salvando...' : isEdit ? 'Salvar treino' : 'Criar treino'}
            </button>
            <Link to={`/students/${studentId}`} className="btn btn-secondary">Cancelar</Link>
          </div>
        </form>
      </div>
    </>
  );
}
