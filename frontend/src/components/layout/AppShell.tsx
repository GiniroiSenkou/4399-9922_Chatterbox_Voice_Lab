import { useEffect } from "react";
import { motion } from "framer-motion";
import { Sun, Moon, Mic2 } from "lucide-react";
import { useWebSocket } from "@/hooks/use-websocket";
import { useVoiceStore } from "@/stores/voice-store";
import { useGenerationStore } from "@/stores/generation-store";
import { useUIStore } from "@/stores/ui-store";
import { LeftPanel } from "./LeftPanel";
import { CenterPanel } from "./CenterPanel";
import { RightPanel } from "./RightPanel";
import { BottomBar } from "./BottomBar";
import { ToastContainer } from "@/components/shared/Toast";

export function AppShell() {
  useWebSocket();

  const { fetchVoices } = useVoiceStore();
  const { fetchHistory } = useGenerationStore();
  const {
    leftPanelWidth, rightPanelWidth,
    theme, toggleTheme,
  } = useUIStore();

  useEffect(() => {
    fetchVoices();
    fetchHistory();
  }, []);

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ backgroundColor: "var(--bg-app)", color: "var(--text-primary)" }}
    >
      {/* Header */}
      <header
        className="flex items-center gap-3 px-5 py-3 shrink-0 z-10"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg gradient-accent flex items-center justify-center">
            <Mic2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-sm gradient-text">Chatterbox Voice Lab Pro</span>
        </div>

        <div className="flex-1" />

        {/* Status indicator */}
        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Local
        </div>

        {/* Theme toggle */}
        <motion.button
          onClick={toggleTheme}
          whileTap={{ scale: 0.9 }}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{
            background: "var(--bg-input)",
            border: "1px solid var(--border-default)",
            color: "var(--text-secondary)",
          }}
        >
          {theme === "dark"
            ? <Sun className="w-4 h-4" />
            : <Moon className="w-4 h-4" />}
        </motion.button>
      </header>

      {/* Main three-column layout */}
      <div className="flex flex-1 min-h-0">
        {/* Left Panel */}
        <div
          className="shrink-0 overflow-hidden"
          style={{ width: leftPanelWidth, borderRight: "1px solid var(--border-subtle)" }}
        >
          <LeftPanel />
        </div>

        {/* Center Panel */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <CenterPanel />
        </div>

        {/* Right Panel */}
        <div
          className="shrink-0 overflow-hidden"
          style={{ width: rightPanelWidth, borderLeft: "1px solid var(--border-subtle)" }}
        >
          <RightPanel />
        </div>
      </div>

      {/* Bottom Bar */}
      <BottomBar />

      {/* Toasts */}
      <ToastContainer />
    </div>
  );
}
