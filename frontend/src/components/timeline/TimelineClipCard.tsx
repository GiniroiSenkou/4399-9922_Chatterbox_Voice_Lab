import { useState } from "react";
import { Play, Trash2, ChevronUp, ChevronDown, Edit2, Check, X } from "lucide-react";
import { useTimelineStore } from "@/stores/timeline-store";
import { useVoiceStore } from "@/stores/voice-store";
import { usePlayerStore } from "@/stores/player-store";
import { generateApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { TimelineClip } from "@/types/project";

interface Props {
  clip: TimelineClip;
  index: number;
  total: number;
}

const TRACK_COLORS = [
  "border-l-violet-500",
  "border-l-cyan-500",
  "border-l-green-500",
  "border-l-orange-500",
  "border-l-rose-500",
];

export function TimelineClipCard({ clip, index, total }: Props) {
  const { updateClip, deleteClip, reorderClips, currentProject } = useTimelineStore();
  const { voices } = useVoiceStore();
  const { loadAudio } = usePlayerStore();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(clip.text);
  const voice = voices.find((v) => v.id === clip.voice_id);
  const trackColor = TRACK_COLORS[clip.track % TRACK_COLORS.length];

  const handleSave = async () => {
    await updateClip(clip.id, { text });
    setEditing(false);
  };

  const handleMoveUp = async () => {
    if (!currentProject || index === 0) return;
    const clips = [...currentProject.clips].sort((a, b) => a.order_index - b.order_index);
    const ids = clips.map((c) => c.id);
    [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
    await reorderClips(ids);
  };

  const handleMoveDown = async () => {
    if (!currentProject || index === total - 1) return;
    const clips = [...currentProject.clips].sort((a, b) => a.order_index - b.order_index);
    const ids = clips.map((c) => c.id);
    [ids[index], ids[index + 1]] = [ids[index + 1], ids[index]];
    await reorderClips(ids);
  };

  return (
    <div className={cn("group glass border border-white/5 rounded-xl p-3 border-l-2", trackColor)}>
      <div className="flex items-start gap-3">
        {/* Reorder buttons */}
        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1">
          <button onClick={handleMoveUp} disabled={index === 0} className="w-5 h-5 rounded hover:bg-white/5 flex items-center justify-center text-zinc-600 hover:text-zinc-400 disabled:opacity-20 transition-colors">
            <ChevronUp className="w-3 h-3" />
          </button>
          <button onClick={handleMoveDown} disabled={index === total - 1} className="w-5 h-5 rounded hover:bg-white/5 flex items-center justify-center text-zinc-600 hover:text-zinc-400 disabled:opacity-20 transition-colors">
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        {/* Clip number */}
        <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[10px] text-zinc-500 shrink-0 mt-0.5">
          {index + 1}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex items-start gap-2">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                autoFocus
                className="flex-1 px-2 py-1 text-xs rounded-lg bg-white/5 border border-white/10 text-zinc-200 resize-none focus:outline-none focus:border-violet-500/40"
              />
              <div className="flex flex-col gap-1">
                <button onClick={handleSave} className="w-6 h-6 rounded flex items-center justify-center bg-green-500/20 text-green-400 hover:bg-green-500/30">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => { setText(clip.text); setEditing(false); }} className="w-6 h-6 rounded flex items-center justify-center bg-red-500/20 text-red-400 hover:bg-red-500/30">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-300 leading-relaxed line-clamp-2">{clip.text}</p>
          )}

          <div className="flex items-center gap-2 mt-1.5">
            {voice && <span className="text-[10px] text-zinc-500">{voice.name}</span>}
            {clip.speaker_label && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-500">{clip.speaker_label}</span>
            )}
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium",
              clip.model === "turbo" ? "text-violet-400 bg-violet-500/10" :
              clip.model === "multilingual" ? "text-cyan-400 bg-cyan-500/10" : "text-blue-400 bg-blue-500/10"
            )}>
              {clip.model}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {clip.generation_id && (
            <button
              onClick={() => loadAudio(generateApi.getAudioUrl(clip.generation_id!))}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 text-zinc-500 hover:text-violet-400 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
            </button>
          )}
          <button
            onClick={() => { setText(clip.text); setEditing(true); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => deleteClip(clip.id)}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
