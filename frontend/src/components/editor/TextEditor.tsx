import { useRef, useCallback } from "react";
import { useGenerationStore } from "@/stores/generation-store";
import { useEditorStore } from "@/stores/editor-store";
import { TagToolbar } from "./TagToolbar";
import { CharCounter } from "./CharCounter";
import { PARALINGUISTIC_TAGS } from "@/lib/constants";

// Highlight paralinguistic tags in display overlay
function highlightTags(text: string): string {
  const tagPattern = new RegExp(
    `\\[(${PARALINGUISTIC_TAGS.map((t) => t.tag).join("|")})\\]`,
    "gi"
  );
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>")
    .replace(
      tagPattern,
      (match, tag) => `<mark class="bg-violet-500/20 text-violet-300 rounded px-0.5 not-italic">${match}</mark>`
    );
}

export function TextEditor() {
  const { text, setText } = useGenerationStore();
  const { setCursorPosition } = useEditorStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  }, [setText]);

  const handleSelect = useCallback(() => {
    setCursorPosition(textareaRef.current?.selectionStart ?? 0);
  }, [setCursorPosition]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Ctrl+Enter triggers generation (handled in parent)
    setCursorPosition(textareaRef.current?.selectionStart ?? 0);
  }, [setCursorPosition]);

  return (
    <div className="flex flex-col gap-2">
      <TagToolbar />

      <div className="relative rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-violet-500/40 transition-all" style={{ border: "1px solid var(--border-default)" }}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onSelect={handleSelect}
          onKeyUp={handleSelect}
          onKeyDown={handleKeyDown}
          placeholder="Enter text to synthesize…

You can use paralinguistic tags like [laugh], [sigh], [whisper] for natural expression.

Example: Hello there! [chuckle] I wasn't expecting to see you here."
          rows={8}
          className="w-full px-4 py-3 text-sm resize-none focus:outline-none font-mono leading-relaxed"
          style={{ background: "var(--bg-input)", color: "var(--text-primary)" }}
          spellCheck={false}
        />
      </div>

      <CharCounter text={text} />
    </div>
  );
}
