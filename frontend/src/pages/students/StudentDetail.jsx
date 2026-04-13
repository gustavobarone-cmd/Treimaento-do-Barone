import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';

function initials(name) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function formatDate(d) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

export default function StudentDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const api = useApi();
  const [student, setStudent] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [loading,  setLoading] = useState(true);
  const [error,    setError]   = useState(null);

  useEffect(() => {
    Promise.all([api.getStudent(id), api.getWorkouts(id)])
      .then(([s, w]) => {
        setStudent(s);
        setWorkouts(w);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDeleteStudent() {
    if (!confirm(`Remover ${student.name}? Esta ação não pode ser desfeita.`)) return;
    try {
      await api.deleteStudent(id);
      navigate('/students');
    } catch (e) { alert(e.message); }
  }

  async function handleDeletePeriod(periodId) {
    if (!confirm('Remover este período?')) return;
    try {
      await api.deletePeriod(id, periodId);
      setStudent(s => ({ ...s, periods: s.periods.filter(p => p.id !== periodId) }));
    } catch (e) { alert(e.message); }
  }

  async function handleDeleteWorkout(workoutId) {
    if (!confirm('Remover este treino?')) return;
    try {
      await api.deleteWorkout(id, workoutId);
      setWorkouts((curr) => curr.filter((w) => w.id !== workoutId));
    } catch (e) { alert(e.message); }
  }

  if (loading)  return <div className="loading">Carregando...</div>;
  if (error)    return <div className="error-msg">{error}</div>;
  if (!student) return null;

  return (
    <>
      <Link to="/students" className="back-link">← Alunos</Link>

      {/* Dados do aluno */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="avatar" style={{ background: student.avatar_color }}>
              {initials(student.name)}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{student.name}</div>
              {student.email && <div style={{ fontSize: 13, color: 'var(--text2)' }}>{student.email}</div>}
              {student.phone && <div style={{ fontSize: 13, color: 'var(--text2)' }}>{student.phone}</div>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link to={`/students/${id}/history`} className="btn btn-primary btn-sm">Histórico</Link>
            <Link to={`/students/${id}/edit`} className="btn btn-secondary btn-sm">Editar</Link>
            <button onClick={handleDeleteStudent} className="btn btn-danger btn-sm">Remover</button>
          </div>
        </div>
        {student.notes && (
          <div style={{ fontSize: 14, color: 'var(--text2)', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
            {student.notes}
          </div>
        )}
      </div>

      {/* Períodos */}
      <div className="card">
        <div className="card-header">
          <h2>Períodos de Treinamento</h2>
          <Link to={`/students/${id}/periods/new`} className="btn btn-primary btn-sm">+ Novo Período</Link>
        </div>
        {student.periods.length === 0 ? (
          <div className="empty" style={{ padding: '20px 0' }}>
            <p>Nenhum período cadastrado.</p>
          </div>
        ) : (
          student.periods.map(p => (
            <div key={p.id} className="period-row">
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span className="period-name">{p.name}</span>
                  <span className={`badge ${p.is_active ? 'badge-active' : 'badge-inactive'}`}>
                    {p.is_active ? 'Ativo' : 'Encerrado'}
                  </span>
                </div>
                <div className="period-dates">{formatDate(p.start_date)} – {formatDate(p.end_date)}</div>
                {p.objective && <div className="period-obj">{p.objective}</div>}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <Link to={`/students/${id}/periods/${p.id}/edit`} className="btn btn-secondary btn-sm">Editar</Link>
                <button onClick={() => handleDeletePeriod(p.id)} className="btn btn-danger btn-sm">✕</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Treinos */}
      <div className="card">
        <div className="card-header">
          <h2>Treinos</h2>
          <Link to={`/students/${id}/workouts/new`} className="btn btn-primary btn-sm">+ Novo Treino</Link>
        </div>

        {workouts.length === 0 ? (
          <div className="empty" style={{ padding: '20px 0' }}>
            <p>Nenhum treino cadastrado.</p>
          </div>
        ) : (
          workouts.map((w) => (
            <div key={w.id} className="period-row">
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span className="period-name">{w.name}</span>
                  <span className={`badge ${w.mode === 'series' ? 'badge-active' : 'badge-inactive'}`}>
                    {w.mode === 'series' ? 'Séries' : 'Tempo'}
                  </span>
                </div>
                <div className="period-dates">
                  {w.period_name ? `Período: ${w.period_name}` : 'Sem período vinculado'}
                </div>
                {w.notes && <div className="period-obj">{w.notes}</div>}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <Link to={`/students/${id}/workouts/${w.id}/run`} className="btn btn-primary btn-sm">Executar</Link>
                <Link to={`/students/${id}/workouts/${w.id}/edit`} className="btn btn-secondary btn-sm">Editar</Link>
                <button onClick={() => handleDeleteWorkout(w.id)} className="btn btn-danger btn-sm">✕</button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
