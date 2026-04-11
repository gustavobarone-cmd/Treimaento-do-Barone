import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/client';

const COLORS = ['#6366f1','#ec4899','#f59e0b','#22c55e','#06b6d4','#f97316','#8b5cf6','#64748b'];

function initials(name) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

// Redimensiona imagem para max 300x300 e retorna base64 JPEG (TRE-85)
function resizeImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const MAX = 300;
        let w = img.width, h = img.height;
        if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } }
        else        { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function StudentForm() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const isEdit   = Boolean(id);

  const [form,    setForm]    = useState({ name: '', email: '', phone: '', notes: '', avatar_color: '#6366f1', photo: '' });
  const [loading, setLoading] = useState(isEdit);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!isEdit) return;
    api.getStudent(id)
      .then(s => setForm({ name: s.name, email: s.email || '', phone: s.phone || '', notes: s.notes || '', avatar_color: s.avatar_color, photo: s.photo || '' }))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }));

  async function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const base64 = await resizeImage(file);
      setForm(f => ({ ...f, photo: base64 }));
    } catch {
      setError('Erro ao processar a imagem.');
    }
  }

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
          {/* Foto / Avatar */}
          <div className="form-group">
            <label style={{ marginBottom: 8 }}>Foto do aluno</label>
            <div className="photo-upload-area">
              <div className="photo-preview-wrap">
                {form.photo
                  ? <img src={form.photo} alt="Preview" />
                  : <div
                      className="avatar-fallback"
                      style={{ background: form.avatar_color, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: '#fff' }}
                    >
                      {form.name ? initials(form.name) : '?'}
                    </div>
                }
              </div>
              <div className="photo-upload-controls">
                <input
                  type="file"
                  accept="image/*"
                  className="photo-file-input"
                  onChange={handlePhotoChange}
                />
                {form.photo && (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => setForm(f => ({ ...f, photo: '' }))}
                  >
                    Remover foto
                  </button>
                )}
                <span style={{ fontSize: 12, color: 'var(--text2)' }}>
                  Máx. 300×300px — comprimido automaticamente
                </span>
              </div>
            </div>
          </div>

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
            <label style={{ marginBottom: 8 }}>Cor do avatar (quando sem foto)</label>
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
