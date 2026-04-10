import { useEffect, useState } from "react";
import { Search, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useVoiceStore } from "@/stores/voice-store";
import { VoiceCard } from "./VoiceCard";
import { VoiceUploadModal } from "./VoiceUploadModal";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export function VoiceLibrary() {
  const { voices, isLoading, fetchVoices } = useVoiceStore();
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);

  const filtered = voices.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSearch = (q: string) => {
    setSearch(q);
    fetchVoices(q || undefined);
  };

  useEffect(() => {
    const id = window.setInterval(() => {
      void fetchVoices(search || undefined, { silent: true });
    }, 5000);
    return () => window.clearInterval(id);
  }, [fetchVoices, search]);

  return (
    <div className="flex flex-col h-full p-3 gap-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search voices…"
          className="w-full pl-8 pr-3 py-2 text-xs rounded-xl focus:outline-none focus:border-violet-500/50 transition-colors"
          style={{
            background: "var(--bg-input)",
            border: "1px solid var(--border-default)",
            color: "var(--text-primary)",
          }}
        />
      </div>

      {/* Upload button */}
      <button
        onClick={() => setUploadOpen(true)}
        className="flex items-center gap-2 w-full py-2.5 px-3 rounded-xl border border-dashed border-violet-500/30 text-violet-400 text-xs font-medium hover:bg-violet-500/5 hover:border-violet-500/50 transition-all"
      >
        <Plus className="w-4 h-4" />
        Add Voice
      </button>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center flex-1">
          <LoadingSpinner />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-4">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-1">
            <Search className="w-5 h-5 text-zinc-600" />
          </div>
          <p className="text-xs text-zinc-500">
            {search ? "No voices match your search" : "No voices yet. Upload one to get started."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 overflow-y-auto">
          {filtered.map((voice, i) => (
            <motion.div
              key={voice.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <VoiceCard voice={voice} />
            </motion.div>
          ))}
        </div>
      )}

      <VoiceUploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}
