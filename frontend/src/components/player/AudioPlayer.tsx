import { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";
import { Play, Pause, Square, SkipBack, SkipForward, Volume2, Download } from "lucide-react";
import { usePlayerStore } from "@/stores/player-store";
import { formatTime } from "@/lib/utils";
import { ABComparison } from "./ABComparison";

export function AudioPlayer() {
  const wsRef = useRef<WaveSurfer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    currentAudioUrl, loadToken, isPlaying, currentTime, duration, volume, abMode,
    consumeAutoPlayOnLoad, setPlaying, setCurrentTime, setDuration, setVolume,
  } = usePlayerStore();

  useEffect(() => {
    if (!containerRef.current) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "rgba(139, 92, 246, 0.35)",
      progressColor: "rgba(139, 92, 246, 0.85)",
      cursorColor: "rgba(139, 92, 246, 0.6)",
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 40,
      normalize: true,
      interact: true,
    });

    ws.on("ready", () => setDuration(ws.getDuration()));
    ws.on("audioprocess", () => setCurrentTime(ws.getCurrentTime()));
    ws.on("play", () => setPlaying(true));
    ws.on("pause", () => setPlaying(false));
    ws.on("finish", () => { setPlaying(false); setCurrentTime(0); });

    wsRef.current = ws;
    return () => { ws.destroy(); wsRef.current = null; };
  }, []);

  useEffect(() => {
    if (wsRef.current && currentAudioUrl) {
      const shouldAutoPlay = consumeAutoPlayOnLoad();
      wsRef.current.once("ready", () => {
        if (shouldAutoPlay) {
          wsRef.current?.play();
        }
      });
      wsRef.current.load(currentAudioUrl);
    }
  }, [currentAudioUrl, loadToken, consumeAutoPlayOnLoad]);

  useEffect(() => { wsRef.current?.setVolume(volume); }, [volume]);

  const playPause = () => wsRef.current?.playPause();
  const stop = () => { wsRef.current?.stop(); setPlaying(false); };
  const skip = (secs: number) => {
    const ws = wsRef.current;
    if (!ws) return;
    ws.setTime(Math.max(0, Math.min(ws.getCurrentTime() + secs, ws.getDuration())));
  };

  return (
    <div className="h-full flex items-center gap-4 px-5">
      {/* Playback controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => skip(-5)}
          disabled={!currentAudioUrl}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-white/5 disabled:opacity-30 transition-colors"
        >
          <SkipBack className="w-4 h-4" />
        </button>
        <button
          onClick={playPause}
          disabled={!currentAudioUrl}
          className="w-9 h-9 rounded-xl flex items-center justify-center gradient-accent text-white disabled:opacity-30 hover:opacity-90 transition-all shadow-lg"
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>
        <button
          onClick={stop}
          disabled={!currentAudioUrl}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-white/5 disabled:opacity-30 transition-colors"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
        </button>
        <button
          onClick={() => skip(5)}
          disabled={!currentAudioUrl}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-white/5 disabled:opacity-30 transition-colors"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* Time */}
      <span className="text-[11px] font-mono text-zinc-500 shrink-0 tabular-nums w-20">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>

      {/* Waveform */}
      <div className="flex-1 min-w-0">
        {abMode ? (
          <ABComparison />
        ) : (
          <div
            ref={containerRef}
            className={`waveform-container ${!currentAudioUrl ? "opacity-30" : ""}`}
          />
        )}
        {!currentAudioUrl && !abMode && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xs text-zinc-600">Generate speech to preview</span>
          </div>
        )}
      </div>

      {/* Volume */}
      <div className="flex items-center gap-2 shrink-0 w-28">
        <Volume2 className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Download */}
      {currentAudioUrl && !abMode && (
        <a
          href={currentAudioUrl}
          download="output.wav"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors shrink-0"
          title="Download WAV"
        >
          <Download className="w-4 h-4" />
        </a>
      )}
    </div>
  );
}
