import { useRef, useState } from "react";
import { Play, Trash2, Check, Pencil, X, ImagePlus, ImageOff } from "lucide-react";
import { motion } from "framer-motion";
import { cn, formatDuration } from "@/lib/utils";
import { useVoiceStore } from "@/stores/voice-store";
import { useUIStore } from "@/stores/ui-store";
import { useVoicePreviewStore } from "@/stores/voice-preview-store";
import { voicesApi } from "@/lib/api";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import type { VoiceProfile } from "@/types/voice";

interface Props { voice: VoiceProfile }

export function VoiceCard({ voice }: Props) {
  const {
    selectedVoiceId,
    selectVoice,
    deleteVoice,
    updateVoice,
    voiceAvatars,
    setVoiceAvatar,
    removeVoiceAvatar,
  } = useVoiceStore();
  const { addToast } = useUIStore();
  const { activePreviewVoiceId, playPreview, stopPreview } = useVoicePreviewStore();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(voice.name);
  const [savingName, setSavingName] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isSelected = selectedVoiceId === voice.id;
  const playing = activePreviewVoiceId === voice.id;
  const avatarUrl = voiceAvatars[voice.id] || null;

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    void playPreview(voice.id, voicesApi.getAudioUrl(voice.id)).catch(() => {
      addToast({ type: "error", message: "Could not play preview" });
    });
  };

  const initials = voice.name.slice(0, 2).toUpperCase();
  const colors = ["from-violet-500 to-cyan-500", "from-rose-500 to-orange-500", "from-green-500 to-teal-500", "from-blue-500 to-indigo-500"];
  const color = colors[voice.id.charCodeAt(0) % colors.length];

  const startRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraftName(voice.name);
    setEditingName(true);
  };

  const cancelRename = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingName(false);
    setDraftName(voice.name);
  };

  const submitRename = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    const name = draftName.trim();
    if (!name || name === voice.name) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      await updateVoice(voice.id, { name });
      addToast({ type: "success", message: "Voice renamed" });
      setEditingName(false);
    } catch (err: any) {
      addToast({ type: "error", message: err?.message || "Failed to rename voice" });
    } finally {
      setSavingName(false);
    }
  };

  const handleChooseAvatar = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleAvatarPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.currentTarget.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      addToast({ type: "error", message: "Please choose an image file" });
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      addToast({ type: "error", message: "Image too large (max 3MB)" });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) return;
      setVoiceAvatar(voice.id, result);
      addToast({ type: "success", message: "Voice picture updated" });
    };
    reader.onerror = () => {
      addToast({ type: "error", message: "Could not read image file" });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeVoiceAvatar(voice.id);
    addToast({ type: "info", message: "Voice picture removed" });
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarPicked}
      />
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => selectVoice(isSelected ? null : voice.id)}
        className={cn(
          "group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all",
          isSelected
            ? "bg-violet-500/10 border border-violet-500/30"
            : "hover:bg-white/5 border border-transparent"
        )}
      >
        {/* Avatar */}
        <div className={cn("w-9 h-9 rounded-full bg-gradient-to-br flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden", color)}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={`${voice.name} avatar`} className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {editingName ? (
            <form
              onSubmit={submitRename}
              className="flex items-center gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                autoFocus
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                className="text-xs w-full px-2 py-1 rounded border focus:outline-none"
                style={{
                  background: "var(--bg-input)",
                  borderColor: "var(--border-default)",
                  color: "var(--text-primary)",
                }}
                maxLength={80}
              />
              <button
                type="submit"
                disabled={savingName || !draftName.trim()}
                className="w-6 h-6 rounded flex items-center justify-center hover:bg-emerald-500/20 text-emerald-400 disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={cancelRename}
                className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/10 text-zinc-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{voice.name}</span>
              {isSelected && <Check className="w-3 h-3 text-violet-400 shrink-0" />}
            </div>
          )}
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              {formatDuration(voice.duration_ms)}
            </span>
            {voice.language && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5" style={{ color: "var(--text-muted)" }}>
                {voice.language.toUpperCase()}
              </span>
            )}
            {voice.tags?.slice(0, 2).map((tag) => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handlePlay}
            className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
              playing ? "bg-violet-500/20 text-violet-400" : "hover:bg-white/10 text-zinc-500 hover:text-zinc-300"
            )}
          >
            {playing ? (
              <span className="flex gap-0.5">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-0.5 h-3 bg-violet-400 rounded animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </span>
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
          </button>
          <button
            onClick={startRename}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-cyan-500/20 text-zinc-500 hover:text-cyan-400 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleChooseAvatar}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-blue-500/20 text-zinc-500 hover:text-blue-400 transition-colors"
            title="Set voice picture"
          >
            <ImagePlus className="w-3.5 h-3.5" />
          </button>
          {avatarUrl && (
            <button
              onClick={handleRemoveAvatar}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-amber-500/20 text-zinc-500 hover:text-amber-400 transition-colors"
              title="Remove voice picture"
            >
              <ImageOff className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete Voice"
        message={`Delete "${voice.name}"? This cannot be undone.`}
        onConfirm={async () => {
          if (playing) {
            stopPreview();
          }
          try {
            await deleteVoice(voice.id);
          } catch {}
          setConfirmDelete(false);
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
