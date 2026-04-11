import { Outlet } from 'react-router-dom';
import { useWakeLock }           from '../hooks/useWakeLock';
import { useAudioSessionAmbient } from '../hooks/useAudioSessionAmbient';

export default function Layout() {
  useWakeLock();
  useAudioSessionAmbient();

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Personal Trainer</h1>
          <p className="sub">Gestão de alunos e treinos</p>
        </div>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </>
  );
}
