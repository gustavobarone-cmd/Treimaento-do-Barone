import { useEffect, useRef } from 'react';

/**
 * Mantém a tela acesa enquanto o componente estiver montado.
 * Re-adquire o lock automaticamente se o usuário mudar de aba e voltar.
 */
export function useWakeLock() {
  const lockRef = useRef(null);

  useEffect(() => {
    if (!('wakeLock' in navigator)) return;

    async function acquire() {
      try {
        lockRef.current = await navigator.wakeLock.request('screen');
      } catch {
        // Ignorado silenciosamente — dispositivo pode negar (bateria baixa etc.)
      }
    }

    acquire();

    function onVisibility() {
      if (document.visibilityState === 'visible') acquire();
    }

    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      lockRef.current?.release();
      lockRef.current = null;
    };
  }, []);
}
