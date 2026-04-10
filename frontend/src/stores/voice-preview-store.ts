import { create } from "zustand";

interface VoicePreviewStore {
  activePreviewVoiceId: string | null;
  previewAudio: HTMLAudioElement | null;
  playPreview: (voiceId: string, url: string) => Promise<void>;
  stopPreview: () => void;
}

export const useVoicePreviewStore = create<VoicePreviewStore>((set, get) => ({
  activePreviewVoiceId: null,
  previewAudio: null,

  playPreview: async (voiceId, url) => {
    const currentAudio = get().previewAudio;
    const currentVoiceId = get().activePreviewVoiceId;

    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    if (currentAudio && currentVoiceId === voiceId) {
      set({ activePreviewVoiceId: null, previewAudio: null });
      return;
    }

    const nextAudio = new Audio(url);
    nextAudio.volume = 0.8;
    nextAudio.onended = () => {
      if (get().previewAudio === nextAudio) {
        set({ activePreviewVoiceId: null, previewAudio: null });
      }
    };
    nextAudio.onerror = () => {
      if (get().previewAudio === nextAudio) {
        set({ activePreviewVoiceId: null, previewAudio: null });
      }
    };

    set({ activePreviewVoiceId: voiceId, previewAudio: nextAudio });

    try {
      await nextAudio.play();
    } catch (error) {
      if (get().previewAudio === nextAudio) {
        set({ activePreviewVoiceId: null, previewAudio: null });
      }
      throw error;
    }
  },

  stopPreview: () => {
    const audio = get().previewAudio;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    set({ activePreviewVoiceId: null, previewAudio: null });
  },
}));
