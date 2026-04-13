import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';

function youtubeIdFromUrl(url) {
  if (!url) return null;
  const raw = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;

  try {
    const u = new URL(raw);
    if (u.hostname.includes('youtu.be')) return u.pathname.replace('/', '').slice(0, 11);
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return v.slice(0, 11);
      const parts = u.pathname.split('/').filter(Boolean);
      const idx = parts.findIndex((p) => p === 'embed' || p === 'shorts');
      if (idx >= 0 && parts[idx + 1]) return parts[idx + 1].slice(0, 11);
    }
  } catch {
    return null;
  }
  return null;
}

function buildExecutionList(workout, mobilityItems = []) {
  const blocks    = Array.isArray(workout?.blocks) ? workout.blocks : [];
  const preItems  = mobilityItems.filter((m) => m.phase === 'pre');
  const postItems = mobilityItems.filter((m) => m.phase === 'post');
  const list = [];

  if (preItems.length > 0) {
    preItems.forEach((m, idx) => {
      list.push({
        key: `pre-${idx}`,
        kind: 'phase',
        phaseTag: 'pre',
        blockName: 'Mobilidade Pré-Treino',
        blockIndex: -1,
        itemName: m.name_pt,
        itemIndex: idx,
        mode: 'tempo',
        sets: 1,
        reps: 0,
        seconds: Number(m.default_duration_s || 30),
        loadKg: null,
        notes: m.cue || null,
        youtubeUrl: m.youtube_id ? `https://www.youtube.com/watch?v=${m.youtube_id}` : null,
        restAfterSec: 0,
        blockRestBetweenSec: 0,
        region: m.region || null,
        totalInPhase: preItems.length,
        indexInPhase: idx,
      });
    });
  } else {
    const preSec = Number(workout?.pre_mobility_sec || 0);
    if (preSec > 0) {
      list.push({
        key: 'pre-mobility',
        kind: 'phase',
        phaseTag: 'pre',
        blockName: 'Mobilidade Pré',
        blockIndex: -1,
        itemName: 'Mobilidade e aquecimento',
        itemIndex: -1,
        mode: 'tempo',
        sets: 1,
        reps: 0,
        seconds: preSec,
        loadKg: null,
        notes: 'Prepare o corpo para o treino.',
        youtubeUrl: null,
        restAfterSec: 0,
        blockRestBetweenSec: 0,
      });
    }
  }

  blocks.forEach((block, blockIndex) => {
    (block.items || []).forEach((item, itemIndex) => {
      const sets = Math.max(1, Number(item.sets || 1));
      list.push({
        key: `${blockIndex}-${itemIndex}`,
        kind: 'exercise',
        blockName: block.name || `Bloco ${blockIndex + 1}`,
        blockIndex,
        itemName: item.exercise_name,
        itemIndex,
        mode: item.prescription_mode,
        sets,
        reps: Number(item.reps || 0),
        seconds: Number(item.seconds || 0),
        loadKg: item.load_kg,
        notes: item.notes,
        youtubeUrl: item.youtube_url,
        restAfterSec: Number(item.rest_after_sec || 0),
        blockRestBetweenSec: Number(block.rest_between_exercises_sec || 0),
      });
    });
  });

  if (postItems.length > 0) {
    postItems.forEach((m, idx) => {
      list.push({
        key: `post-${idx}`,
        kind: 'phase',
        phaseTag: 'post',
        blockName: 'Alongamento Pós-Treino',
        blockIndex: Number.MAX_SAFE_INTEGER,
        itemName: m.name_pt,
        itemIndex: idx,
        mode: 'tempo',
        sets: 1,
        reps: 0,
        seconds: Number(m.default_duration_s || 30),
        loadKg: null,
        notes: m.cue || null,
        youtubeUrl: m.youtube_id ? `https://www.youtube.com/watch?v=${m.youtube_id}` : null,
        restAfterSec: 0,
        blockRestBetweenSec: 0,
        region: m.region || null,
        totalInPhase: postItems.length,
        indexInPhase: idx,
      });
    });
  } else {
    const postSec = Number(workout?.post_stretch_sec || 0);
    if (postSec > 0) {
      list.push({
        key: 'post-stretch',
        kind: 'phase',
        phaseTag: 'post',
        blockName: 'Alongamento Pós',
        blockIndex: Number.MAX_SAFE_INTEGER,
        itemName: 'Alongamento e relaxamento',
        itemIndex: -1,
        mode: 'tempo',
        sets: 1,
        reps: 0,
        seconds: postSec,
        loadKg: null,
        notes: 'Reduza a frequência cardíaca e finalize com calma.',
        youtubeUrl: null,
        restAfterSec: 0,
        blockRestBetweenSec: 0,
      });
    }
  }

  return list;
}

function fmt(sec) {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

export default function WorkoutRun() {
  const { id: studentId, workoutId } = useParams();
  const navigate = useNavigate();
  const api = useApi();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workout, setWorkout] = useState(null);

  const [stepIndex, setStepIndex] = useState(0);
  const [setDone, setSetDone] = useState(1);
  const [running, setRunning] = useState(false);
  const [timerLeft, setTimerLeft] = useState(0);
  const [resting, setResting] = useState(false);
  const [restLeft, setRestLeft] = useState(0);
  const [message, setMessage] = useState('');
  const [savingLogs, setSavingLogs] = useState(false);
  const [savedLogs, setSavedLogs] = useState(false);
  const [seriesLogs, setSeriesLogs] = useState([]);
  const [setInput, setSetInput] = useState({ performed_reps: '', performed_load_kg: '', notes: '' });
  const [beepEnabled, setBeepEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [mobilityItems, setMobilityItems] = useState([]);
  const [sessionId] = useState(() => (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}`));
  const [sessionStartedAt] = useState(() => new Date().toISOString());

  const tickRef = useRef(null);
  const restTickRef = useRef(null);
  const pendingAfterRestRef = useRef(null);

  const beepRef = useRef(null);

  function beep() {
    if (!beepEnabled) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!beepRef.current) beepRef.current = new Ctx();
      const ctx = beepRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.value = 0.06;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // sem suporte de áudio
    }
  }

  function speak(text) {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    try {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'pt-BR';
      utter.rate = 1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    } catch {
      // sem voz disponível
    }
  }

  function announce(text) {
    setMessage(text);
    beep();
    speak(text);
  }

  useEffect(() => {
    Promise.all([
      api.getWorkout(studentId, workoutId),
      api.getWorkoutMobility(studentId, workoutId),
    ])
      .then(([w, mob]) => {
        setWorkout(w);
        setMobilityItems(Array.isArray(mob) ? mob : []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [studentId, workoutId]);

  const list = useMemo(() => buildExecutionList(workout, mobilityItems), [workout, mobilityItems]);
  const current = list[stepIndex] || null;

  function resetSetInput() {
    setSetInput({
      performed_reps: current?.mode === 'series' ? String(current?.reps || '') : '',
      performed_load_kg: current?.loadKg != null ? String(current.loadKg) : '',
      notes: '',
    });
  }

  useEffect(() => {
    setSetDone(1);
    setRunning(false);
    setResting(false);
    setRestLeft(0);
    if (current?.mode === 'tempo') {
      setTimerLeft(current.seconds || 0);
    } else {
      setTimerLeft(0);
    }
    resetSetInput();
  }, [stepIndex, current?.mode, current?.seconds]);

  function addSetLog(setNumber) {
    if (!current) return;
    setSeriesLogs((prev) => ([
      ...prev,
      {
        session_id: sessionId,
        session_started_at: sessionStartedAt,
        block_name: current.blockName,
        exercise_name: current.itemName,
        set_number: setNumber,
        target_mode: current.mode,
        target_reps: current.mode === 'series' ? current.reps : null,
        target_seconds: current.mode === 'tempo' ? current.seconds : null,
        performed_reps: setInput.performed_reps,
        performed_load_kg: setInput.performed_load_kg,
        notes: setInput.notes,
      },
    ]));
  }

  function startRest(seconds, onDone, msg) {
    const sec = Math.max(0, Number(seconds || 0));
    if (sec <= 0) {
      if (typeof onDone === 'function') onDone();
      return;
    }
    setRunning(false);
    setResting(true);
    setRestLeft(sec);
    pendingAfterRestRef.current = onDone || null;
    announce(msg || `Descanso de ${sec} segundos`);
  }

  useEffect(() => {
    if (!resting) return;
    restTickRef.current = setInterval(() => {
      setRestLeft((prev) => {
        if (prev <= 1) {
          clearInterval(restTickRef.current);
          restTickRef.current = null;
          setResting(false);
          announce('Descanso concluído');
          const fn = pendingAfterRestRef.current;
          pendingAfterRestRef.current = null;
          if (typeof fn === 'function') fn();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (restTickRef.current) {
        clearInterval(restTickRef.current);
        restTickRef.current = null;
      }
    };
  }, [resting]);

  function nextStepOrFinish() {
    if (stepIndex >= list.length - 1) {
      setRunning(false);
      announce('Treino concluído');
      return;
    }

    const next = list[stepIndex + 1];
    const changedBlock = next.blockIndex !== current.blockIndex;
    if (changedBlock && current.kind === 'exercise') {
      announce(`Bloco concluído. Próximo: ${next.blockName}`);
    }
    setStepIndex((v) => v + 1);
  }

  function getTransitionRestSeconds() {
    if (!current) return 0;
    const next = list[stepIndex + 1];
    if (!next) return Number(current.restAfterSec || 0);
    const sameBlock = next.blockIndex === current.blockIndex;
    const blockRest = sameBlock ? Number(current.blockRestBetweenSec || 0) : 0;
    return Number(current.restAfterSec || 0) + blockRest;
  }

  useEffect(() => {
    if (!running || resting || !current || current.mode !== 'tempo') return;

    tickRef.current = setInterval(() => {
      setTimerLeft((prev) => {
        if (prev <= 1) {
          clearInterval(tickRef.current);
          tickRef.current = null;

          if (setDone < current.sets) {
            const nextSet = setDone + 1;
            addSetLog(setDone);
            return startRest(current.restAfterSec || 0, () => {
              setSetDone(nextSet);
              announce(`Série ${setDone} concluída. Iniciando série ${nextSet}`);
              setRunning(true);
              setTimerLeft(current.seconds || 0);
              resetSetInput();
            }, `Série ${setDone} concluída. Iniciando descanso`), 0;
          }

          addSetLog(setDone);
          const restSeconds = getTransitionRestSeconds();
          startRest(restSeconds, () => {
            nextStepOrFinish();
            setRunning(true);
          }, 'Exercício concluído. Iniciando descanso');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [running, resting, current, setDone, list, stepIndex]);

  function goNext() {
    nextStepOrFinish();
  }

  function doneSeries() {
    if (!current) return;
    addSetLog(setDone);
    if (setDone < current.sets) {
      const nextSet = setDone + 1;
      startRest(current.restAfterSec || 0, () => {
        setSetDone(nextSet);
        announce(`Série ${setDone} concluída. Iniciando série ${nextSet}`);
        resetSetInput();
      }, `Série ${setDone} concluída. Iniciando descanso`);
      return;
    }
    const restSeconds = getTransitionRestSeconds();
    startRest(restSeconds, () => {
      nextStepOrFinish();
    }, 'Exercício concluído. Iniciando descanso');
  }

  async function saveLogs() {
    if (seriesLogs.length === 0) {
      announce('Nenhum registro para salvar');
      return;
    }
    setSavingLogs(true);
    try {
      await api.saveWorkoutLogs(studentId, workoutId, seriesLogs);
      setSavedLogs(true);
      announce('Registros de séries salvos com sucesso');
    } catch (e) {
      setError(e.message || 'Falha ao salvar registros');
    } finally {
      setSavingLogs(false);
    }
  }

  if (loading) return <div className="loading">Carregando treino...</div>;
  if (error) return <div className="error-msg">{error}</div>;
  if (!workout || list.length === 0) {
    return (
      <>
        <Link to={`/students/${studentId}`} className="back-link">← Voltar</Link>
        <div className="empty">Este treino não possui exercícios.</div>
      </>
    );
  }

  const progress = Math.round(((stepIndex + 1) / list.length) * 100);
  const ytId = youtubeIdFromUrl(current?.youtubeUrl);

  return (
    <>
      <Link to={`/students/${studentId}`} className="back-link">← Voltar</Link>

      <div className="card">
        <div className="card-header">
          <h2>{workout.name}</h2>
          <span className="badge badge-active">{progress}%</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>
          Etapa {stepIndex + 1} de {list.length} · {current.blockName}
        </div>
        <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 999 }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent)', borderRadius: 999 }} />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>{current.itemName}</h2>
          <span className={`badge ${current.kind === 'phase' ? 'badge-inactive' : current.mode === 'series' ? 'badge-active' : 'badge-inactive'}`}>
            {current.kind === 'phase'
              ? (current.phaseTag === 'pre' ? 'Pré-treino' : 'Pós-treino')
              : current.mode === 'series' ? 'Séries' : 'Tempo'}
          </span>
        </div>

        {current.kind === 'phase' && current.totalInPhase > 1 && (
          <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>
            Exercício {current.indexInPhase + 1} de {current.totalInPhase}
            {current.region && ` · ${current.region}`}
          </div>
        )}
        {current.kind === 'phase' && current.region && !current.totalInPhase && (
          <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>{current.region}</div>
        )}

        {ytId ? (
          <div style={{ marginBottom: 12 }}>
            <iframe
              title="video-exercicio"
              width="100%"
              height="220"
              src={`https://www.youtube.com/embed/${ytId}?autoplay=0&mute=1&controls=1&loop=1&playlist=${ytId}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ border: 0, borderRadius: 10 }}
            />
          </div>
        ) : (
          <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text2)' }}>Sem vídeo cadastrado para este exercício.</div>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setBeepEnabled((v) => !v)}>
            Beep: {beepEnabled ? 'ON' : 'OFF'}
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setVoiceEnabled((v) => !v)}>
            Voz: {voiceEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {resting && (
          <div className="card" style={{ marginBottom: 12, borderColor: 'var(--accent)' }}>
            <div style={{ fontSize: 14, marginBottom: 6 }}>Descanso em andamento</div>
            <div style={{ fontSize: 32, fontWeight: 800 }}>{fmt(restLeft)}</div>
          </div>
        )}

        {current.mode === 'series' ? (
          <>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
              Série {setDone} / {current.sets}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 12 }}>
              {current.reps} reps {current.loadKg != null ? `· ${current.loadKg} kg` : ''}
            </div>
            <div className="form-row" style={{ marginBottom: 10 }}>
              <div className="form-group">
                <label>
                  Reps realizadas
                  <input
                    type="number"
                    min="0"
                    value={setInput.performed_reps}
                    onChange={(e) => setSetInput((v) => ({ ...v, performed_reps: e.target.value }))}
                  />
                </label>
              </div>
              <div className="form-group">
                <label>
                  Carga usada (kg)
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={setInput.performed_load_kg}
                    onChange={(e) => setSetInput((v) => ({ ...v, performed_load_kg: e.target.value }))}
                  />
                </label>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 10 }}>
              <label>
                Observação da série
                <input
                  value={setInput.notes}
                  onChange={(e) => setSetInput((v) => ({ ...v, notes: e.target.value }))}
                  placeholder="Ex: última repetição com dificuldade"
                />
              </label>
            </div>
            <button type="button" className="btn btn-primary" onClick={doneSeries}>
              Concluí a série
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
              Série {setDone} / {current.sets}
            </div>
            <div style={{ fontSize: 42, fontWeight: 800, marginBottom: 12, letterSpacing: 1 }}>
              {fmt(timerLeft)}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-primary" onClick={() => setRunning((v) => !v)}>
                {running ? 'Pausar' : 'Iniciar'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setRunning(false);
                  setResting(false);
                  setTimerLeft(current.seconds || 0);
                }}
              >
                Reiniciar
              </button>
            </div>
            <div className="form-row" style={{ marginTop: 10 }}>
              <div className="form-group">
                <label>
                  Carga usada (kg)
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={setInput.performed_load_kg}
                    onChange={(e) => setSetInput((v) => ({ ...v, performed_load_kg: e.target.value }))}
                  />
                </label>
              </div>
              <div className="form-group">
                <label>
                  Observação
                  <input
                    value={setInput.notes}
                    onChange={(e) => setSetInput((v) => ({ ...v, notes: e.target.value }))}
                    placeholder="Ex: manter ritmo"
                  />
                </label>
              </div>
            </div>
          </>
        )}

        {current.notes && (
          <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text2)', fontStyle: current.kind === 'phase' ? 'italic' : 'normal' }}>
            {current.kind === 'phase' ? '' : 'Observação: '}{current.notes}
          </div>
        )}
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setStepIndex((v) => Math.max(0, v - 1))}
            disabled={stepIndex === 0}
          >
            Exercício anterior
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={goNext}
            disabled={stepIndex === list.length - 1}
          >
            Próximo exercício
          </button>
          <button type="button" className="btn btn-danger" onClick={() => navigate(`/students/${studentId}`)}>
            Encerrar treino
          </button>
          <button type="button" className="btn btn-primary" onClick={saveLogs} disabled={savingLogs || savedLogs}>
            {savedLogs ? 'Registros salvos' : savingLogs ? 'Salvando...' : `Salvar registros (${seriesLogs.length})`}
          </button>
        </div>
      </div>

      {message && (
        <div className="card" style={{ borderColor: 'var(--accent)' }}>
          <div style={{ fontSize: 14 }}>{message}</div>
        </div>
      )}
    </>
  );
}
