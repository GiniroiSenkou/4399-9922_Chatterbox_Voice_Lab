import { VoiceLibrary } from "@/components/voice-library/VoiceLibrary";

export function LeftPanel() {
  return (
    <div
      className="h-full flex flex-col overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
          Voice Library
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        <VoiceLibrary />
      </div>
    </div>
  );
}
