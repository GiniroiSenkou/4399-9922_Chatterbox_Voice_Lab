import { create } from "zustand";

interface EditorStore {
  cursorPosition: number;
  setCursorPosition: (pos: number) => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
  cursorPosition: 0,
  setCursorPosition: (pos) => set({ cursorPosition: pos }),
}));
