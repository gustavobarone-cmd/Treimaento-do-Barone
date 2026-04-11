import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';

function initials(name) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function formatDate(d) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

export default function StudentList() {
  const [students, setStudents] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    api.getStudents()
      .then(setStudents)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Carregando alunos...</div>;
  if (error)   return <div className="error-msg">{error}</div>;

  return (
    <>
      <div className="page-header">
        <h2>Meus Alunos</h2>
        <Link to="/students/new" className="btn btn-primary btn-sm">+ Novo Aluno</Link>
      </div>

      {students.length === 0 ? (
        <div className="empty">
          <p>Nenhum aluno cadastrado ainda.</p>
          <Link to="/students/new" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>
            Cadastrar primeiro aluno
          </Link>
        </div>
      ) : (
        <div className="card">
          {students.map(s => (
            <Link key={s.id} to={`/students/${s.id}`} className="student-row">
              <div className="avatar" style={{ background: s.avatar_color }}>
                {initials(s.name)}
              </div>
              <div className="student-info">
                <div className="student-name">{s.name}</div>
                <div className="student-meta">
                  {s.active_period
                    ? `${s.active_period.name} · ${formatDate(s.active_period.start_date)} – ${formatDate(s.active_period.end_date)}`
                    : 'Sem período ativo'}
                </div>
              </div>
              {s.active_period
                ? <span className="badge badge-active">Ativo</span>
                : <span className="badge badge-inactive">Inativo</span>}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
