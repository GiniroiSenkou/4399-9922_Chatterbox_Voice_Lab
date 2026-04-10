import { PARALINGUISTIC_TAGS } from "@/lib/constants";
import { useGenerationStore } from "@/stores/generation-store";
import { useEditorStore } from "@/stores/editor-store";

export function TagToolbar() {
  const { text, setText } = useGenerationStore();
  const { cursorPosition } = useEditorStore();

  const insertTag = (tag: string) => {
    const tagStr = `[${tag}]`;
    const before = text.slice(0, cursorPosition);
    const after = text.slice(cursorPosition);
    setText(before + tagStr + after);
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-[10px] text-zinc-600 mr-1">Tags:</span>
      {PARALINGUISTIC_TAGS.map(({ tag, label, icon }) => (
        <button
          key={tag}
          onClick={() => insertTag(tag)}
          title={label}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-white/5 hover:bg-violet-500/10 border border-white/5 hover:border-violet-500/30 text-zinc-400 hover:text-violet-400 transition-all"
        >
          <span>{icon}</span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
