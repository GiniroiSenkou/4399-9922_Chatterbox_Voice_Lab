import { ChevronRight } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { TextEditor } from "@/components/editor/TextEditor";
import { ModelSelector } from "@/components/editor/ModelSelector";
import { GenerateButton } from "@/components/editor/GenerateButton";
import { GenerationHistory } from "@/components/editor/GenerationHistory";

export function CenterPanel() {
  const { leftPanelCollapsed, toggleLeftPanel } = useUIStore();

  return (
    <div className="h-full flex flex-col">
      {/* Panel toggle buttons */}
      <div className="flex items-center gap-1 px-3 py-2 shrink-0" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        {leftPanelCollapsed && (
          <button
            onClick={toggleLeftPanel}
            className="w-6 h-6 rounded-md hover:bg-white/5 flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Show Voice Library"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
        <div className="flex-1" />
      </div>

      <div className="flex-1 flex flex-col gap-4 p-5 overflow-y-auto">
        <ModelSelector />
        <TextEditor />
        <GenerateButton />
        <GenerationHistory />
      </div>
    </div>
  );
}
