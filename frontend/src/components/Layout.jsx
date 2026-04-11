import { Outlet, useNavigate } from 'react-router-dom';
import { useWakeLock }           from '../hooks/useWakeLock';
import { useAudioSessionAmbient } from '../hooks/useAudioSessionAmbient';
import { useDarkMode }            from '../hooks/useDarkMode';

export default function Layout() {
  useWakeLock();
  useAudioSessionAmbient();
  const [dark, toggleDark] = useDarkMode();
  const navigate = useNavigate();

  return (
    <>
      <header className="topbar">
        <button
          className="topbar-brand"
          onClick={() => navigate('/')}
          aria-label="Início"
        >
          <strong>Personal Trainer</strong>
          <span className="sub">Gestão de alunos e treinos</span>
        </button>
        <div className="topbar-actions">
          <button
            className="topbar-action"
            onClick={toggleDark}
            aria-label={dark ? 'Ativar modo claro' : 'Ativar modo escuro'}
            title={dark ? 'Modo claro' : 'Modo escuro'}
          >
            {dark ? '☀️' : '🌙'}
          </button>
        </div>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </>
  );
}
