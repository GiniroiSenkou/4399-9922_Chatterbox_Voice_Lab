import { useState } from "react";
import { ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGenerationStore } from "@/stores/generation-store";
import { DEFAULT_PARAMS, LANGUAGES } from "@/lib/constants";
import { ParamSlider } from "./ParamSlider";
import { PresetSelector } from "./PresetSelector";

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 my-1">
      <div className="flex-1 h-px bg-white/5" />
      <span className="text-[10px] text-zinc-600 uppercase tracking-wider">{label}</span>
      <div className="flex-1 h-px bg-white/5" />
    </div>
  );
}

export function ControlPanel() {
  const { params, setParam, setParams, model } = useGenerationStore();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleReset = () => setParams({ ...DEFAULT_PARAMS });

  const handleSeedRandom = () =>
    setParam("seed", Math.floor(Math.random() * 2 ** 31));

  return (
    <div className="flex flex-col gap-3 p-4">
      <PresetSelector />

      <Divider label="Voice" />

      <ParamSlider
        label="Exaggeration"
        value={params.exaggeration}
        min={0.25}
        max={2.0}
        step={0.05}
        defaultValue={DEFAULT_PARAMS.exaggeration}
        onChange={(v) => setParam("exaggeration", v)}
        description="Controls expressiveness and emotion intensity"
      />
      <ParamSlider
        label="CFG Weight"
        value={params.cfg_weight}
        min={0.0}
        max={1.0}
        step={0.05}
        defaultValue={DEFAULT_PARAMS.cfg_weight}
        onChange={(v) => setParam("cfg_weight", v)}
        description="Higher = more faithful to reference voice"
      />
      <ParamSlider
        label="Temperature"
        value={params.temperature}
        min={0.05}
        max={2.0}
        step={0.05}
        defaultValue={DEFAULT_PARAMS.temperature}
        onChange={(v) => setParam("temperature", v)}
        description="Lower = more consistent, higher = more expressive"
      />

      <Divider label="Timing" />

      <ParamSlider
        label="Speed"
        value={params.speed}
        min={0.5}
        max={2.0}
        step={0.05}
        defaultValue={DEFAULT_PARAMS.speed}
        onChange={(v) => setParam("speed", v)}
        formatValue={(v) => `${v.toFixed(2)}×`}
      />

      {/* Language selector for multilingual */}
      {model === "multilingual" && (
        <>
          <Divider label="Language" />
          <div>
            <span className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Output Language</span>
            <select
              value={params.language_id ?? ""}
              onChange={(e) => setParam("language_id", e.target.value || null)}
              className="w-full px-3 py-2 text-xs rounded-xl focus:outline-none focus:border-violet-500/50 transition-colors"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
            >
              <option value="">Auto (match reference)</option>
              {LANGUAGES.map((l) => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
          </div>
        </>
      )}

      <Divider label="Seed" />

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <span className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Seed</span>
          <input
            type="number"
            value={params.seed ?? ""}
            onChange={(e) => setParam("seed", e.target.value ? parseInt(e.target.value) : null)}
            placeholder="Random"
            className="w-full px-3 py-2 text-xs rounded-xl focus:outline-none focus:border-violet-500/50 transition-colors"
            style={{ background: "var(--bg-input)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
          />
        </div>
        <button
          onClick={handleSeedRandom}
          title="Randomize seed"
          className="px-3 py-2 rounded-xl text-xs bg-white/5 hover:bg-white/8 border border-white/8 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          🎲
        </button>
      </div>
      <p className="text-[10px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
        Seed controls randomness. Same voice + same text + same params + same seed gives very similar output.
        Leave it empty for a new random take each time, or set a fixed number to reproduce a result.
      </p>

      {/* Norm loudness toggle */}
      <div className="flex items-center justify-between py-1">
        <span className="text-[11px] font-medium text-zinc-400">Normalize Loudness</span>
        <button
          onClick={() => setParam("norm_loudness", !params.norm_loudness)}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            params.norm_loudness ? "bg-violet-500" : "bg-white/10"
          }`}
        >
          <span
            className={`absolute top-1/2 -translate-y-1/2 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
              params.norm_loudness ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
      <p className="text-[10px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
        Keeps output volume more consistent between generations. Disable it if you want to preserve raw dynamics
        and natural loudness differences from the model.
      </p>

      {/* Advanced sampling */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors py-1"
      >
        {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        Advanced Sampling
      </button>

      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden flex flex-col gap-3"
          >
            <ParamSlider
              label="Top P"
              value={params.top_p}
              min={0.0}
              max={1.0}
              step={0.05}
              defaultValue={DEFAULT_PARAMS.top_p}
              onChange={(v) => setParam("top_p", v)}
              description="Nucleus sampling: lower values keep safer, more likely tokens; higher values allow more variation."
            />
            <ParamSlider
              label="Top K"
              value={params.top_k}
              min={0}
              max={200}
              step={1}
              defaultValue={DEFAULT_PARAMS.top_k}
              onChange={(v) => setParam("top_k", v)}
              formatValue={(v) => v.toString()}
              description="Limits choices to the K most likely tokens at each step. Lower K is steadier; higher K is more diverse."
            />
            <ParamSlider
              label="Min P"
              value={params.min_p}
              min={0.0}
              max={0.5}
              step={0.01}
              defaultValue={DEFAULT_PARAMS.min_p}
              onChange={(v) => setParam("min_p", v)}
              description="Drops very low-probability tokens. Higher values reduce odd artifacts but can sound less expressive."
            />
            <ParamSlider
              label="Repetition Penalty"
              value={params.repetition_penalty}
              min={1.0}
              max={2.0}
              step={0.05}
              defaultValue={DEFAULT_PARAMS.repetition_penalty}
              onChange={(v) => setParam("repetition_penalty", v)}
              description="Penalizes repeated tokens/phrases. Increase if loops appear; too high can make delivery less natural."
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset button */}
      <button
        onClick={handleReset}
        className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-white/5 transition-all mt-2"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Reset to Defaults
      </button>
    </div>
  );
}
