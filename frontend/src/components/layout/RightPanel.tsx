import { useUIStore } from "@/stores/ui-store";
import { ControlPanel } from "@/components/controls/ControlPanel";

export function RightPanel() {
  const { rightPanelWidth } = useUIStore();

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ width: rightPanelWidth }}>
      <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
          Controls
        </span>
        <div className="w-6 h-6" />
      </div>
      <div className="flex-1 overflow-y-auto">
        <ControlPanel />
      </div>
    </div>
  );
}
