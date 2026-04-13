import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuthContext } from '../contexts/AuthContext';

export function Dashboard() {
  const api = useApi();
  const { user } = useAuthContext();
  const [stats, setStats] = useState({
    studentsCount: 0,
    activeStudents: 0,
    todayWorkouts: 0,
    recentSessions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const students = await api.getStudents();
        const activeCount = students.filter(s => s.active_period).length;
        // TODO: Contar treinos de hoje e sessões recentes
        setStats({
          studentsCount: students.length,
          activeStudents: activeCount,
          todayWorkouts: 0,
          recentSessions: 0,
        });
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
        <h1>Bem-vindo, {user?.email}!</h1>
        <p className="dashboard-subtitle">Resumo de hoje</p>
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
        </div>

        <div className="stat-card">
          <div className="stat-value">{stats.todayWorkouts}</div>
          <div className="stat-label">Treinos Hoje</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{stats.recentSessions}</div>
          <div className="stat-label">Sessões Recentes</div>
        </div>
      </div>

      <div className="dashboard-actions">
        <Link to="/students/new" className="btn btn-primary">
          + Novo Aluno
        </Link>
        <Link to="/students" className="btn btn-secondary">
          Gerenciar Alunos
        </Link>
      </div>
    </div>
  );
}

export default Dashboard;
