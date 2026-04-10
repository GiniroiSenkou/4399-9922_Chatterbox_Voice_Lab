import { motion } from "framer-motion";
import { Sparkles, GitCompare } from "lucide-react";
import { useGeneration } from "@/hooks/use-generation";
import { useGenerationStore } from "@/stores/generation-store";
import { useVoiceStore } from "@/stores/voice-store";
import { cn } from "@/lib/utils";

export function GenerateButton() {
  const { triggerGenerate, triggerGenerateAB, isGenerating, queueLength, progress, stage, canGenerate } =
    useGeneration();
  const { text, queue } = useGenerationStore();
  const { voices, selectedVoiceId } = useVoiceStore();
  const selectedVoice = voices.find((v) => v.id === selectedVoiceId);
  const generateDisabled = !canGenerate || !text.trim();
  const compareDisabled = isGenerating || queueLength > 0 || !canGenerate || !text.trim();

  const stageLabels: Record<string, string> = {
    queued: "Queued…",
    loading_model: "Loading model…",
    generating: "Generating speech…",
    saving: "Saving audio…",
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Selected voice chip */}
      {selectedVoice ? (
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          Voice: <span className="text-zinc-200 font-medium">{selectedVoice.name}</span>
          {queueLength > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Queue: {queueLength}
            </span>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="w-2 h-2 rounded-full bg-zinc-600" />
          No voice selected — pick one from the library
        </div>
      )}

      {/* Progress bar */}
      {isGenerating && (
        <div className="relative h-1.5 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 gradient-accent rounded-full"
            initial={{ width: "5%" }}
            animate={{ width: `${Math.max(5, progress * 100)}%` }}
            transition={{ duration: 0.3 }}
          />
          <div className="absolute inset-0 animate-shimmer" />
        </div>
      )}

      <div className="flex gap-2">
        {/* Main generate button */}
        <motion.button
          onClick={triggerGenerate}
          disabled={generateDisabled}
          whileTap={generateDisabled ? {} : { scale: 0.97 }}
          className={cn(
            "flex-1 relative flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all overflow-hidden",
            generateDisabled
              ? "bg-white/5 text-zinc-600 cursor-not-allowed"
              : "gradient-accent text-white hover:opacity-90 glow-accent animate-pulse-glow"
          )}
        >
          <Sparkles className={cn("w-4 h-4", isGenerating && "animate-spin")} />
          {isGenerating ? "Add To Queue" : "Generate"}
        </motion.button>

        {/* A/B Compare button */}
        <motion.button
          onClick={triggerGenerateAB}
          disabled={compareDisabled}
          whileTap={compareDisabled ? {} : { scale: 0.97 }}
          title="Compare Turbo vs Multilingual"
          className={cn(
            "px-4 py-3 rounded-xl text-sm font-medium transition-all",
            compareDisabled
              ? "bg-white/5 text-zinc-600 cursor-not-allowed"
              : "bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400"
          )}
        >
          <GitCompare className="w-4 h-4" />
        </motion.button>
      </div>

      {isGenerating && (
        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
          {(stageLabels[stage] ?? "Generating…")}
          {queueLength > 0 ? ` • ${queueLength} queued` : ""}
        </p>
      )}

      {queueLength > 0 && (
        <div
          className="rounded-lg border p-2 space-y-1.5 max-h-28 overflow-y-auto"
          style={{ borderColor: "var(--border-subtle)", background: "var(--bg-input)" }}
        >
          <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Queue
          </p>
          {queue.map((item, idx) => {
            const voiceName = voices.find((v) => v.id === item.voice_id)?.name ?? "Unknown voice";
            return (
              <div key={item.id} className="text-[11px] flex items-center gap-2">
                <span className="w-4 text-right" style={{ color: "var(--text-muted)" }}>
                  {idx + 1}
                </span>
                <span className="px-1.5 py-0.5 rounded border border-white/10 text-[10px] shrink-0" style={{ color: "var(--text-muted)" }}>
                  {item.model}
                </span>
                <span className="truncate" style={{ color: "var(--text-secondary)" }}>
                  {voiceName}: {item.text}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
