import { create } from "zustand";

interface PlayerStore {
  currentAudioUrl: string | null;
  loadToken: number;
  isPlaying: boolean;
  autoPlayOnLoad: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  abMode: boolean;
  audioA: string | null;
  audioB: string | null;
  activeAB: "A" | "B";
  loadAudio: (url: string, opts?: { autoplay?: boolean }) => void;
  consumeAutoPlayOnLoad: () => boolean;
  setPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  enableABMode: (urlA: string, urlB: string) => void;
  disableABMode: () => void;
  toggleAB: () => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentAudioUrl: null,
  loadToken: 0,
  isPlaying: false,
  autoPlayOnLoad: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  abMode: false,
  audioA: null,
  audioB: null,
  activeAB: "A",

  loadAudio: (url, opts) =>
    set((s) => ({
      currentAudioUrl: url,
      loadToken: s.loadToken + 1,
      isPlaying: false,
      currentTime: 0,
      abMode: false,
      autoPlayOnLoad: !!opts?.autoplay,
    })),
  consumeAutoPlayOnLoad: (): boolean => {
    const shouldAutoPlay = get().autoPlayOnLoad;
    if (shouldAutoPlay) {
      set({ autoPlayOnLoad: false });
    }
    return shouldAutoPlay;
  },

  setPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume }),

  enableABMode: (urlA, urlB) =>
    set({
      abMode: true,
      audioA: urlA,
      audioB: urlB,
      activeAB: "A",
      currentAudioUrl: urlA,
    }),

  disableABMode: () =>
    set({
      abMode: false,
      audioA: null,
      audioB: null,
    }),

  toggleAB: () =>
    set((s) => {
      const next = s.activeAB === "A" ? "B" : "A";
      return {
        activeAB: next,
        currentAudioUrl: next === "A" ? s.audioA : s.audioB,
      };
    }),
}));
