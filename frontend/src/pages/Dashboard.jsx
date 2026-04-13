import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';

export function Dashboard() {
  const api = useApi();
  const [stats, setStats] = useState({
    studentsCount: 0,
    activeStudents: 0,
    totalWorkouts: 0,
  });
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const students = await api.getStudents();
        
        // Count active students
        const activeCount = students.filter(s => s.active_period).length;
        
        // Get total workout count
        let totalWkts = 0;
        const recentWkts = [];
        for (const student of students.slice(0, 5)) {
          try {
            const workouts = await api.getWorkouts(student.id);
            totalWkts += workouts.length;
            workouts.slice(0, 3).forEach(w => {
              recentWkts.push({ 
                student: student.name, 
                studentId: student.id, 
                workout: w.name,
                workoutId: w.id,
                createdAt: w.created_at 
              });
            });
          } catch (err) {
            // Silently skip if fetch fails
          }
        }

        // Sort by createdAt and limit to 5
        recentWkts.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        
        setStats({
          studentsCount: students.length,
          activeStudents: activeCount,
          totalWorkouts: totalWkts,
        });
        setRecentWorkouts(recentWkts.slice(0, 5));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [api]);

  if (loading) return <div className="loading">Carregando dashboard...</div>;
  if (error) return <div className="error-msg">{error}</div>;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p className="dashboard-subtitle">Resumo do seu programa de treinamento</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.studentsCount}</div>
          <div className="stat-label">Total de Alunos</div>
          <Link to="/students" className="stat-link">Ver todos →</Link>
        </div>

        <div className="stat-card">
          <div className="stat-value">{stats.activeStudents}</div>
          <div className="stat-label">Alunos Ativos</div>
          <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
            com período ativo
          </p>
        </div>

        <div className="stat-card">
          <div className="stat-value">{stats.totalWorkouts}</div>
          <div className="stat-label">Total de Treinos</div>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ fontSize: '2em' }}>→</div>
          <div className="stat-label">Banco de Exercícios</div>
          <Link to="/exercises" className="stat-link">Gerenciar →</Link>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header">
          <h2>Treinos Recentes</h2>
        </div>

        {recentWorkouts.length === 0 ? (
          <div className="empty" style={{ padding: 16 }}>
            <p>Nenhum treino registered ainda.</p>
          </div>
        ) : (
          <div className="recent-list">
            {recentWorkouts.map((item, idx) => (
              <Link
                key={idx}
                to={`/students/${item.studentId}/workouts/${item.workoutId}`}
                className="recent-item"
              >
                <div className="recent-info">
                  <div className="recent-title">{item.workout}</div>
                  <div className="recent-subtitle">{item.student}</div>
                </div>
                <div className="recent-date">
                  {item.createdAt ? new Date(item.createdAt).toLocaleDateString('pt-BR') : '—'}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="dashboard-actions" style={{ marginTop: 24 }}>
        <Link to="/students/new" className="btn btn-primary">
          + Novo Aluno
        </Link>
        <Link to="/exercises/new" className="btn btn-secondary">
          + Novo Exercício
        </Link>
      </div>
    </div>
  );
}

export default Dashboard;
