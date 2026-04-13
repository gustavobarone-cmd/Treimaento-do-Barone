import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';

export default function ExercisesList() {
  const api = useApi();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [muscleGroupFilter, setMuscleGroupFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const muscleGroups = [
    'peito', 'costas', 'ombro', 'bíceps', 'tríceps', 'antebraço',
    'abdômen', 'quadríceps', 'posterior da coxa', 'glúteos', 'panturrilha'
  ];

  useEffect(() => {
    setLoading(true);
    const filters = {};
    if (muscleGroupFilter) filters.muscle_group = muscleGroupFilter;
    if (searchTerm) filters.search = searchTerm;

    api.getExercises(filters)
      .then(setExercises)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [api, muscleGroupFilter, searchTerm]);

  const handleDelete = async (id) => {
    if (!confirm('Remover este exercício?')) return;
    try {
      await api.deleteExercise(id);
      setExercises(exs => exs.filter(e => e.id !== id));
    } catch (err) {
      alert(`Erro ao deletar: ${err.message}`);
    }
  };

  if (loading) return <div className="loading">Carregando exercícios...</div>;
  if (error) return <div className="error-msg">{error}</div>;

  return (
    <>
      <div className="page-header">
        <h2>Banco de Exercícios</h2>
        <Link to="/exercises/new" className="btn btn-primary btn-sm">+ Novo Exercício</Link>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="filter-row">
            <input
              type="text"
              placeholder="Pesquisar exercício..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="filter-input"
            />
            <select
              value={muscleGroupFilter}
              onChange={(e) => setMuscleGroupFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">Todos os grupos musculares</option>
              {muscleGroups.map(mg => (
                <option key={mg} value={mg}>{mg}</option>
              ))}
            </select>
          </div>
        </div>

        {exercises.length === 0 ? (
          <div className="empty">
            <p>Nenhum exercício encontrado.</p>
            <Link to="/exercises/new" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>
              Criar primeiro exercício
            </Link>
          </div>
        ) : (
          <div className="exercises-table">
            <div className="table-header">
              <div className="col col-name">Nome</div>
              <div className="col col-group">Grupo Muscular</div>
              <div className="col col-duration">Duração</div>
              <div className="col col-public">Tipo</div>
              <div className="col col-actions">Ações</div>
            </div>
            {exercises.map(ex => (
              <div key={ex.id} className="table-row">
                <div className="col col-name">
                  <Link to={`/exercises/${ex.id}/edit`} className="link">
                    {ex.name}
                  </Link>
                </div>
                <div className="col col-group">{ex.muscle_group || '—'}</div>
                <div className="col col-duration">{ex.default_duration_s}s</div>
                <div className="col col-public">
                  {ex.is_public ? <span className="badge">Público</span> : <span className="badge badge-private">Privado</span>}
                </div>
                <div className="col col-actions">
                  <Link to={`/exercises/${ex.id}/edit`} className="btn btn-sm">Editar</Link>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(ex.id)}>
                    Deletar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
