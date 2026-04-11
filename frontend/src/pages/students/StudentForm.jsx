import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/client';

const COLORS = ['#6366f1','#ec4899','#f59e0b','#22c55e','#06b6d4','#f97316','#8b5cf6','#64748b'];

export default function StudentForm() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const isEdit   = Boolean(id);

  const [form,    setForm]    = useState({ name: '', email: '', phone: '', notes: '', avatar_color: '#6366f1' });
  const [loading, setLoading] = useState(isEdit);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!isEdit) return;
    api.getStudent(id)
      .then(s => setForm({ name: s.name, email: s.email || '', phone: s.phone || '', notes: s.notes || '', avatar_color: s.avatar_color }))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (isEdit) {
        await api.updateStudent(id, form);
        navigate(`/students/${id}`);
      } else {
        const s = await api.createStudent(form);
        navigate(`/students/${s.id}`);
      }
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  if (loading) return <div className="loading">Carregando...</div>;

  return (
    <>
      <Link to={isEdit ? `/students/${id}` : '/students'} className="back-link">
        ← {isEdit ? 'Voltar' : 'Alunos'}
      </Link>

      <div className="card">
        <div className="card-header">
          <h2>{isEdit ? 'Editar Aluno' : 'Novo Aluno'}</h2>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              Nome *
              <input value={form.name} onChange={set('name')} placeholder="Nome completo" required />
            </label>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                E-mail
                <input type="email" value={form.email} onChange={set('email')} placeholder="email@exemplo.com" />
              </label>
            </div>
            <div className="form-group">
              <label>
                Telefone
                <input type="tel" value={form.phone} onChange={set('phone')} placeholder="(11) 99999-9999" />
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>
              Observações
              <textarea value={form.notes} onChange={set('notes')} rows={3} placeholder="Restrições, objetivos, observações..." />
            </label>
          </div>

          <div className="form-group">
            <label style={{ marginBottom: 8 }}>Cor do avatar</label>
            <div className="color-swatches">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`color-swatch ${form.avatar_color === c ? 'selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setForm(f => ({ ...f, avatar_color: c }))}
                  aria-label={`Cor ${c}`}
                />
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Cadastrar aluno'}
            </button>
            <Link to={isEdit ? `/students/${id}` : '/students'} className="btn btn-secondary">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}
