import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useVoiceUpload } from "@/hooks/use-voice-upload";
import { VoiceDropZone } from "./VoiceDropZone";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { LANGUAGES } from "@/lib/constants";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function VoiceUploadModal({ open, onClose }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  const { upload, uploading, getRootProps, getInputProps, isDragActive, acceptedFiles } =
    useVoiceUpload(() => {
      onClose();
      setName("");
      setDescription("");
      setTagsInput("");
      setLanguage("");
    });

  const file = acceptedFiles[0] ?? null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name.trim()) return;
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    await upload(file, name.trim(), description.trim() || undefined, tags.length ? tags : undefined, language || undefined);
  };

  // Auto-fill name from filename
  const handleFileChange = (f: File | null) => {
    if (f && !name) {
      const base = f.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
      setName(base.charAt(0).toUpperCase() + base.slice(1));
    }
  };

  if (file && name === "") handleFileChange(file);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93 }}
            className="relative rounded-2xl p-6 w-full max-w-md shadow-2xl"
            style={{ background: "var(--bg-panel)", border: "1px solid var(--border-default)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Add Voice Profile</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center hover:text-zinc-300 transition-colors"
                style={{ color: "var(--text-muted)" }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <VoiceDropZone
                getRootProps={getRootProps}
                getInputProps={getInputProps}
                isDragActive={isDragActive}
                file={file}
              />
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                Recommended: 5-60s of clear speech. Clips with too much silence may fail.
              </p>

              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--text-secondary)" }}>Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Morgan Freeman"
                  className="w-full px-3 py-2 text-sm rounded-xl focus:outline-none focus:border-violet-500/50 transition-colors"
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: "var(--text-secondary)" }}>Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl focus:outline-none focus:border-violet-500/50 transition-colors"
                    style={{ background: "var(--bg-input)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                  >
                    <option value="">Auto-detect</option>
                    {LANGUAGES.map((l) => (
                      <option key={l.id} value={l.id}>{l.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs mb-1.5" style={{ color: "var(--text-secondary)" }}>Tags</label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="male, deep, narrator"
                    className="w-full px-3 py-2 text-sm rounded-xl focus:outline-none focus:border-violet-500/50 transition-colors"
                    style={{ background: "var(--bg-input)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--text-secondary)" }}>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional notes about this voice…"
                  rows={2}
                  className="w-full px-3 py-2 text-sm rounded-xl focus:outline-none focus:border-violet-500/50 transition-colors resize-none"
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                />
              </div>

              <button
                type="submit"
                disabled={!file || !name.trim() || uploading}
                className="w-full py-2.5 rounded-xl text-sm font-semibold gradient-accent text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
              >
                {uploading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Processing audio…
                  </>
                ) : (
                  "Upload Voice"
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
