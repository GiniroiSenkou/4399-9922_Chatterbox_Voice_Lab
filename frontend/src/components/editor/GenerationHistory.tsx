import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Play, Download, Trash2, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGenerationStore } from "@/stores/generation-store";
import { useVoiceStore } from "@/stores/voice-store";
import { usePlayerStore } from "@/stores/player-store";
import { generateApi, presetsApi } from "@/lib/api";
import { cn, truncate, formatDuration } from "@/lib/utils";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import type { Preset } from "@/types/generation";

const MODEL_COLORS: Record<string, string> = {
  turbo: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  standard: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  multilingual: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
};

export function GenerationHistory() {
  const { generations, deleteGeneration, deleteAllHistory } = useGenerationStore();
  const { voices } = useVoiceStore();
  const { loadAudio } = usePlayerStore();
  const [presets, setPresets] = useState<Preset[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);

  const completed = generations.filter((g) => g.status === "completed");
  const voiceById = useMemo(
    () => new Map(voices.map((v) => [v.id, v])),
    [voices]
  );

  useEffect(() => {
    presetsApi.list().then((r) => setPresets(r.data.presets)).catch(() => {});
  }, []);

  const getGenMeta = (gen: (typeof completed)[number]) => {
    const params = (gen.params ?? {}) as Record<string, unknown>;
    const voiceSnapshot = (params._voice_name as string | undefined) ?? voiceById.get(gen.voice_id)?.name;
    const voiceLanguage = (params._voice_language as string | undefined) ?? voiceById.get(gen.voice_id)?.language ?? undefined;

    const presetFromParams = params._preset_name as string | undefined;
    if (presetFromParams) {
      return { voiceName: voiceSnapshot, voiceLanguage, presetName: presetFromParams };
    }

    // Best-effort fallback for old generations without metadata.
    const matched = presets.find((p) => {
      if (p.model !== gen.model || !gen.params) return false;
      return Object.entries(p.params).every(([k, v]) => (gen.params as Record<string, unknown>)[k] === v);
    });

    return {
      voiceName: voiceSnapshot,
      voiceLanguage,
      presetName: matched?.name,
    };
  };

  if (completed.length === 0) return null;

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "var(--glass-bg)", border: "1px solid var(--border-subtle)" }}>
      <div className="w-full flex items-center justify-between gap-2 px-4 py-3 hover:bg-white/3 transition-colors">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 min-w-0"
        >
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
            History ({completed.length})
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          ) : (
            <ChevronDown className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          )}
        </button>

        <button
          onClick={() => setDeleteAllOpen(true)}
          className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
          title="Delete all history"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete All
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col divide-y divide-white/5 max-h-64 overflow-y-auto">
              {completed.map((gen) => {
                const meta = getGenMeta(gen);
                return (
                <div
                  key={gen.id}
                  className="group flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-colors"
                >
                  <button
                    onClick={() => loadAudio(generateApi.getAudioUrl(gen.id), { autoplay: true })}
                    className="w-7 h-7 rounded-full flex items-center justify-center bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 transition-colors shrink-0"
                  >
                    <Play className="w-3 h-3 fill-current" />
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate" style={{ color: "var(--text-primary)" }}>{truncate(gen.text, 60)}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-medium", MODEL_COLORS[gen.model] ?? "text-zinc-400")}>
                        {gen.model}
                      </span>
                      {meta.voiceName && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded border border-white/10 bg-white/5" style={{ color: "var(--text-muted)" }}>
                          Voice: {meta.voiceName}
                        </span>
                      )}
                      {meta.voiceLanguage && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded border border-white/10 bg-white/5" style={{ color: "var(--text-muted)" }}>
                          {String(meta.voiceLanguage).toUpperCase()}
                        </span>
                      )}
                      {meta.presetName && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
                          Preset: {meta.presetName}
                        </span>
                      )}
                      {gen.duration_ms > 0 && (
                        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{formatDuration(gen.duration_ms)}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={generateApi.getAudioUrl(gen.id)}
                      download={`generation-${gen.id.slice(0, 8)}.wav`}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => setDeleteId(gen.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )})}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Generation"
        message="Delete this audio output? This cannot be undone."
        onConfirm={() => { if (deleteId) { deleteGeneration(deleteId); setDeleteId(null); } }}
        onCancel={() => setDeleteId(null)}
      />

      <ConfirmDialog
        open={deleteAllOpen}
        title="Delete All History"
        message={`Delete all ${completed.length} generated audio files from history? This cannot be undone.`}
        confirmLabel="Delete All"
        onConfirm={() => {
          deleteAllHistory();
          setDeleteAllOpen(false);
        }}
        onCancel={() => setDeleteAllOpen(false)}
      />
    </div>
  );
}
