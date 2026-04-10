import { useEffect, useRef, useCallback } from "react";
import WaveSurfer from "wavesurfer.js";
import { usePlayerStore } from "@/stores/player-store";

export function useAudioPlayer(containerId: string) {
  const wsRef = useRef<WaveSurfer | null>(null);
  const { currentAudioUrl, volume, setPlaying, setCurrentTime, setDuration } = usePlayerStore();

  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const ws = WaveSurfer.create({
      container,
      waveColor: "rgba(139, 92, 246, 0.4)",
      progressColor: "rgba(139, 92, 246, 0.9)",
      cursorColor: "#8b5cf6",
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 60,
      normalize: true,
      interact: true,
    });

    ws.on("ready", () => setDuration(ws.getDuration()));
    ws.on("audioprocess", () => setCurrentTime(ws.getCurrentTime()));
    ws.on("play", () => setPlaying(true));
    ws.on("pause", () => setPlaying(false));
    ws.on("finish", () => setPlaying(false));

    wsRef.current = ws;
    return () => {
      ws.destroy();
      wsRef.current = null;
    };
  }, [containerId]);

  useEffect(() => {
    if (wsRef.current && currentAudioUrl) {
      wsRef.current.load(currentAudioUrl);
    }
  }, [currentAudioUrl]);

  useEffect(() => {
    wsRef.current?.setVolume(volume);
  }, [volume]);

  const play = useCallback(() => wsRef.current?.play(), []);
  const pause = useCallback(() => wsRef.current?.pause(), []);
  const playPause = useCallback(() => wsRef.current?.playPause(), []);
  const stop = useCallback(() => {
    wsRef.current?.stop();
    setPlaying(false);
  }, []);
  const seek = useCallback((progress: number) => wsRef.current?.seekTo(progress), []);
  const skip = useCallback((seconds: number) => {
    const ws = wsRef.current;
    if (!ws) return;
    ws.setTime(Math.max(0, Math.min(ws.getCurrentTime() + seconds, ws.getDuration())));
  }, []);

  return { play, pause, playPause, stop, seek, skip };
}
