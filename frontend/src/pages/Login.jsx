import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

function initials(name) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

// Gera URL do avatar animado DiceBear baseado no nome
function dicebearUrl(name) {
  const seed = encodeURIComponent(name);
  return `https://api.dicebear.com/9.x/avataaars-neutral/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

function StudentCard({ student, onClick }) {
  const [imgSrc, setImgSrc] = useState(student.photo || dicebearUrl(student.name));
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <button className="login-card" onClick={onClick}>
      {imgFailed || (!student.photo && !navigator.onLine) ? (
        <div
          className="login-avatar-initials"
          style={{ background: student.avatar_color || '#6366f1' }}
        >
          {initials(student.name)}
        </div>
      ) : (
        <img
          className="login-avatar"
          src={imgSrc}
          alt={student.name}
          onError={() => setImgFailed(true)}
        />
      )}
      <span className="login-name">{student.name.split(' ')[0]}</span>
      {student.active_period
        ? <span className="login-period">{student.active_period.name}</span>
        : <span className="login-no-period">Sem treino ativo</span>}
    </button>
  );
}

export default function Login() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.getStudents().then(setStudents).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="login-page">
      <div className="login-header">
        <h1>Personal Trainer</h1>
        <p>Carregando alunos...</p>
      </div>
    </div>
  );

  return (
    <div className="login-page">
      <div className="login-header">
        <h1>Quem vai treinar hoje?</h1>
        <p>Selecione seu perfil para começar</p>
      </div>

      {students.length === 0 ? (
        <div className="login-empty">
          <p>Nenhum aluno cadastrado.</p>
          <button className="btn btn-primary" onClick={() => navigate('/students/new')}>
            Cadastrar primeiro aluno
          </button>
        </div>
      ) : (
        <div className="login-grid">
          {students.map(s => (
            <StudentCard
              key={s.id}
              student={s}
              onClick={() => navigate(`/students/${s.id}`)}
            />
          ))}
        </div>
      )}

      <button className="login-manage" onClick={() => navigate('/students')}>
        ⚙ Gerenciar alunos
      </button>
    </div>
  );
}
