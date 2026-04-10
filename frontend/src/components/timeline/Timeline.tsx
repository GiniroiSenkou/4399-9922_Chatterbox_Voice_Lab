import { useState } from "react";
import { Plus, Play, Download, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useTimelineStore } from "@/stores/timeline-store";
import { TimelineClipCard } from "./TimelineClipCard";
import { cn } from "@/lib/utils";

export function Timeline() {
  const { currentProject, addClip, reorderClips, deleteProject } = useTimelineStore();
  const [dragging, setDragging] = useState<string | null>(null);

  if (!currentProject) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-500">
        <p className="text-sm">No project open</p>
        <p className="text-xs">Create a project from the Projects menu</p>
      </div>
    );
  }

  const clips = [...currentProject.clips].sort((a, b) => a.order_index - b.order_index);

  return (
    <div className="flex flex-col h-full">
      {/* Timeline header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 shrink-0">
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-zinc-200">{currentProject.name}</h2>
          <p className="text-xs text-zinc-500">{clips.length} clips</p>
        </div>
        <button
          onClick={() => addClip({ text: "New clip", model: "turbo", order_index: clips.length })}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-400 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Clip
        </button>
      </div>

      {/* Track lanes */}
      <div className="flex-1 overflow-y-auto p-4">
        {clips.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-white/10 rounded-xl gap-2 text-zinc-600">
            <p className="text-sm">No clips yet</p>
            <p className="text-xs">Add a clip to get started</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {clips.map((clip, i) => (
              <motion.div
                key={clip.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <TimelineClipCard clip={clip} index={i} total={clips.length} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
