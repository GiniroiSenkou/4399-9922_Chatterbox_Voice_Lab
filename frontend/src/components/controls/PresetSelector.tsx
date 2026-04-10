import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import { presetsApi } from "@/lib/api";
import { useGenerationStore } from "@/stores/generation-store";
import type { Preset } from "@/types/generation";

export function PresetSelector() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const { model, setParams, setSelectedPreset } = useGenerationStore();

  useEffect(() => {
    presetsApi.list().then((r) => setPresets(r.data.presets)).catch(() => {});
  }, []);

  const applyPreset = (preset: Preset) => {
    setParams(preset.params as any);
    setSelectedPreset({ id: preset.id, name: preset.name });
  };

  if (!presets.length) return null;

  const visiblePresets = presets.filter((preset) => preset.model === model);

  return (
    <div>
      <span className="block text-[11px] font-medium text-zinc-400 mb-1.5 flex items-center gap-1">
        <Bookmark className="w-3 h-3" /> Presets
      </span>
      {visiblePresets.length > 0 ? (
        <div className="grid grid-cols-2 gap-1.5">
          {visiblePresets.map((p) => (
            <button
              key={p.id}
              onClick={() => applyPreset(p)}
              className="px-2 py-1.5 rounded-lg text-[10px] font-medium bg-white/5 hover:bg-violet-500/10 border border-white/5 hover:border-violet-500/20 text-zinc-400 hover:text-violet-400 transition-all text-left truncate"
            >
              {p.name}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
          No presets for the current model.
        </p>
      )}
    </div>
  );
}
