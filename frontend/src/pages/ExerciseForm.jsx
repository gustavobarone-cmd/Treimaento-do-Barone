import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';

const muscleGroups = [
  'peito', 'costas', 'ombro', 'bíceps', 'tríceps', 'antebraço',
  'abdômen', 'quadríceps', 'posterior da coxa', 'glúteos', 'panturrilha'
];

function youtubeIdFromUrl(url) {
  if (!url) return '';
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  return match ? match[1] : '';
}

export default function ExerciseForm() {
  const api = useApi();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    name: '',
    muscle_group: '',
    default_duration_s: 30,
    youtube_id: '',
    is_public: 0,
  });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isEdit) return;
    api.getExercise(id)
      .then(ex => setForm(ex))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, isEdit, api]);

  const set = field => e => {
    const value = e.target.type === 'checkbox' ? (e.target.checked ? 1 : 0) : e.target.value;
    setForm(f => ({ ...f, [field]: value }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      if (isEdit) {
        await api.updateExercise(id, form);
        navigate('/exercises');
      } else {
        await api.createExercise(form);
        navigate('/exercises');
      }
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  if (loading) return <div className="loading">Carregando...</div>;

  const youtubeId = youtubeIdFromUrl(form.youtube_id) || form.youtube_id;
  const youtubePreviewUrl = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/default.jpg` : null;

  return (
    <>
      <Link to="/exercises" className="back-link">
        ← Exercícios
      </Link>

      <div className="card">
        <div className="card-header">
          <h2>{isEdit ? 'Editar Exercício' : 'Novo Exercício'}</h2>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              Nome do Exercício *
              <input
                value={form.name}
                onChange={set('name')}
                placeholder="ex: Supino Reto"
                required
              />
            </label>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                Grupo Muscular
                <select value={form.muscle_group} onChange={set('muscle_group')}>
                  <option value="">Selecionar...</option>
                  {muscleGroups.map(mg => (
                    <option key={mg} value={mg}>{mg}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="form-group">
              <label>
                Duração Padrão (segundos)
                <input
                  type="number"
                  value={form.default_duration_s}
                  onChange={set('default_duration_s')}
                  min="10"
                  max="300"
                />
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>
              YouTube ID ou URL
              <input
                value={form.youtube_id}
                onChange={set('youtube_id')}
                placeholder="dQw4w9WgXcQ ou https://youtu.be/..."
              />
            </label>
            {youtubePreviewUrl && (
              <div style={{ marginTop: 8 }}>
                <img src={youtubePreviewUrl} alt="Preview" style={{ maxWidth: 120, borderRadius: 4 }} />
              </div>
            )}
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={form.is_public}
                onChange={set('is_public')}
              />
              Público (disponível para todos os alunos)
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar exercício'}
            </button>
            <Link to="/exercises" className="btn btn-secondary">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}
