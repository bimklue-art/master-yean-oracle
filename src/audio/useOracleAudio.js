import { useEffect, useRef } from "react";
import { createOracleAudioEngineV2 } from "./audioEngine";

export function useOracleAudio(soundEnabled) {
  const audioRef = useRef(null);
  const destroyTimerRef = useRef(null);

  if (!audioRef.current) {
    audioRef.current = createOracleAudioEngineV2();
  }

  useEffect(() => {
    if (destroyTimerRef.current) {
      window.clearTimeout(destroyTimerRef.current);
      destroyTimerRef.current = null;
    }

    audioRef.current.setEnabled(soundEnabled);

    if (soundEnabled) {
      audioRef.current.preload();
    }
  }, [soundEnabled]);

  useEffect(() => {
    return () => {
      destroyTimerRef.current = window.setTimeout(() => {
        audioRef.current?.destroy();
      }, 0);
    };
  }, []);

  return audioRef.current;
}
