import { motion } from "framer-motion";
import { useGenerationStore } from "@/stores/generation-store";
import { MODELS, type ModelId } from "@/lib/constants";

export function ModelSelector() {
  const { model, setModel } = useGenerationStore();

  return (
    <div className="flex gap-1.5 p-1 rounded-xl" style={{ background: "var(--bg-input)", border: "1px solid var(--border-subtle)" }}>
      {MODELS.map((m) => (
        <button
          key={m.id}
          onClick={() => setModel(m.id as ModelId)}
          className="relative flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors"
        >
          {model === m.id && (
            <motion.div
              layoutId="model-indicator"
              className="absolute inset-0 gradient-accent rounded-lg"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span
            className="relative z-10 transition-colors"
            style={{ color: model === m.id ? "#fff" : "var(--text-muted)" }}
          >
            {m.label}
          </span>
        </button>
      ))}
    </div>
  );
}
