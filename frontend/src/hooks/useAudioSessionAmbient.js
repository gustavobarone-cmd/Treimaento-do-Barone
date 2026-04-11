import { useEffect } from 'react';

/**
 * Define o modo de áudio do app como "ambient" (iOS 17+).
 * Isso garante que Spotify, YouTube Music ou qualquer outro app
 * continue tocando em background sem ser interrompido.
 *
 * Em outros navegadores/idades a API não existe — ignorado silenciosamente.
 */
export function useAudioSessionAmbient() {
  useEffect(() => {
    if ('audioSession' in navigator) {
      navigator.audioSession.type = 'ambient';
    }
  }, []);
}
