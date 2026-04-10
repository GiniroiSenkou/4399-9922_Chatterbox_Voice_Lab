import { useCallback } from "react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  defaultValue?: number;
  onChange: (val: number) => void;
  formatValue?: (val: number) => string;
  description?: string;
  className?: string;
}

export function ParamSlider({
  label, value, min, max, step = 0.01, defaultValue, onChange, formatValue, description, className,
}: Props) {
  const pct = ((value - min) / (max - min)) * 100;
  const fmt = formatValue ?? ((v) => v.toFixed(2));

  const handleDoubleClick = useCallback(() => {
    if (defaultValue !== undefined) onChange(defaultValue);
  }, [defaultValue, onChange]);

  return (
    <div className={cn("group", className)}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>{label}</span>
        <button
          onDoubleClick={handleDoubleClick}
          title="Double-click to reset"
          className="text-[11px] font-mono text-violet-400 tabular-nums hover:text-violet-300 transition-colors cursor-default"
        >
          {fmt(value)}
        </button>
      </div>

      <div className="relative">
        {/* Track fill */}
        <div
          className="absolute top-1/2 -translate-y-1/2 left-0 h-1 rounded-full bg-violet-500/60 pointer-events-none"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="relative w-full cursor-pointer"
        />
      </div>

      {description && (
        <p className="text-[10px] text-zinc-600 mt-0.5 leading-relaxed">{description}</p>
      )}
    </div>
  );
}
