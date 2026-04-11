import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/client';

export default function PeriodForm() {
  const { id: studentId, periodId } = useParams();
  const navigate = useNavigate();
  const isEdit   = Boolean(periodId);

  const [form,    setForm]    = useState({ name: '', start_date: '', end_date: '', objective: '', is_active: true });
  const [loading, setLoading] = useState(isEdit);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!isEdit) return;
    api.getPeriods(studentId)
      .then(periods => {
        const p = periods.find(x => x.id === periodId);
        if (!p) { setError('Período não encontrado'); return; }
        setForm({ name: p.name, start_date: p.start_date, end_date: p.end_date, objective: p.objective || '', is_active: Boolean(p.is_active) });
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [studentId, periodId, isEdit]);

  const set = field => e =>
    setForm(f => ({ ...f, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (isEdit) {
        await api.updatePeriod(studentId, periodId, form);
      } else {
        await api.createPeriod(studentId, form);
      }
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
          <h2>{isEdit ? 'Editar Período' : 'Novo Período de Treinamento'}</h2>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              Nome do período *
              <input value={form.name} onChange={set('name')} placeholder="Ex: Fase 1 — Hipertrofia" required />
            </label>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                Data de início *
                <input type="date" value={form.start_date} onChange={set('start_date')} required />
              </label>
            </div>
            <div className="form-group">
              <label>
                Data de fim *
                <input type="date" value={form.end_date} onChange={set('end_date')} required />
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>
              Objetivo
              <textarea value={form.objective} onChange={set('objective')} rows={3} placeholder="Descreva o objetivo deste período..." />
            </label>
          </div>

          <div className="form-group">
            <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={form.is_active} onChange={set('is_active')} style={{ width: 'auto' }} />
              Tornar este período ativo (desativa os demais)
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar período'}
            </button>
            <Link to={`/students/${studentId}`} className="btn btn-secondary">Cancelar</Link>
          </div>
        </form>
      </div>
    </>
  );
}
