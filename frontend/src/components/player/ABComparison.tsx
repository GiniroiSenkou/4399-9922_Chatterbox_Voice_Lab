import { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";
import { usePlayerStore } from "@/stores/player-store";
import { cn } from "@/lib/utils";

export function ABComparison() {
  const containerARef = useRef<HTMLDivElement>(null);
  const containerBRef = useRef<HTMLDivElement>(null);
  const wsARef = useRef<WaveSurfer | null>(null);
  const wsBRef = useRef<WaveSurfer | null>(null);

  const { audioA, audioB, activeAB, toggleAB, disableABMode } = usePlayerStore();

  useEffect(() => {
    const makeWS = (container: HTMLDivElement, color: string) =>
      WaveSurfer.create({
        container,
        waveColor: color,
        progressColor: color.replace("0.35", "0.85"),
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        height: 35,
        normalize: true,
        interact: true,
      });

    if (containerARef.current) {
      wsARef.current = makeWS(containerARef.current, "rgba(139, 92, 246, 0.35)");
      if (audioA) wsARef.current.load(audioA);
    }
    if (containerBRef.current) {
      wsBRef.current = makeWS(containerBRef.current, "rgba(6, 182, 212, 0.35)");
      if (audioB) wsBRef.current.load(audioB);
    }

    return () => {
      wsARef.current?.destroy();
      wsBRef.current?.destroy();
    };
  }, []);

  const playActive = () => {
    const ws = activeAB === "A" ? wsARef.current : wsBRef.current;
    ws?.playPause();
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {/* Model A */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => toggleAB()}
          className={cn(
            "shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors",
            activeAB === "A"
              ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
              : "bg-white/5 text-zinc-500 border border-white/5"
          )}
        >
          TURBO
        </button>
        <div ref={containerARef} className="flex-1" />
      </div>

      {/* Model B */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => toggleAB()}
          className={cn(
            "shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors",
            activeAB === "B"
              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
              : "bg-white/5 text-zinc-500 border border-white/5"
          )}
        >
          MLT
        </button>
        <div ref={containerBRef} className="flex-1" />
      </div>
    </div>
  );
}
