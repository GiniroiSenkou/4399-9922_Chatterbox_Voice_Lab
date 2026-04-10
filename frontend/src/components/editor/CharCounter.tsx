import { cn } from "@/lib/utils";

interface Props { text: string }

const MAX_CHARS = 5000;
const CHUNK_THRESHOLD = 500;

export function CharCounter({ text }: Props) {
  const len = text.length;
  const chunks = Math.ceil(len / CHUNK_THRESHOLD) || 1;
  const willChunk = len > CHUNK_THRESHOLD;
  const pct = Math.min(len / MAX_CHARS, 1);

  return (
    <div className="flex items-center gap-3 px-1">
      {/* Progress bar */}
      <div className="flex-1 h-1 rounded-full bg-white/5">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            pct > 0.9 ? "bg-red-400" : pct > 0.7 ? "bg-yellow-400" : "bg-violet-500"
          )}
          style={{ width: `${pct * 100}%` }}
        />
      </div>

      <span className={cn("text-[10px] tabular-nums", pct > 0.9 ? "text-red-400" : "text-zinc-500")}>
        {len}/{MAX_CHARS}
      </span>

      {willChunk && (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          {chunks} chunks
        </span>
      )}
    </div>
  );
}
