import { create } from "zustand";
import type { VoiceProfile } from "@/types/voice";
import { voicesApi } from "@/lib/api";

const VOICE_AVATARS_KEY = "vl-voice-avatars";

function readVoiceAvatars(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(VOICE_AVATARS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
}

function writeVoiceAvatars(avatars: Record<string, string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(VOICE_AVATARS_KEY, JSON.stringify(avatars));
}

interface VoiceStore {
  voices: VoiceProfile[];
  voiceAvatars: Record<string, string>;
  selectedVoiceId: string | null;
  isLoading: boolean;
  error: string | null;
  fetchVoices: (search?: string, opts?: { silent?: boolean }) => Promise<void>;
  selectVoice: (id: string | null) => void;
  uploadVoice: (file: File, name: string, description?: string, tags?: string[], language?: string) => Promise<void>;
  updateVoice: (id: string, data: Record<string, unknown>) => Promise<void>;
  deleteVoice: (id: string) => Promise<void>;
  setVoiceAvatar: (id: string, dataUrl: string) => void;
  removeVoiceAvatar: (id: string) => void;
}

export const useVoiceStore = create<VoiceStore>((set, get) => ({
  voices: [],
  voiceAvatars: readVoiceAvatars(),
  selectedVoiceId: null,
  isLoading: false,
  error: null,

  fetchVoices: async (search, opts) => {
    if (!opts?.silent) {
      set({ isLoading: true, error: null });
    }
    try {
      const res = await voicesApi.list({ search });
      if (opts?.silent) {
        set({ voices: res.data.voices });
      } else {
        set({ voices: res.data.voices, isLoading: false });
      }
    } catch (e: any) {
      if (opts?.silent) {
        set({ error: e.message });
      } else {
        set({ error: e.message, isLoading: false });
      }
    }
  },

  selectVoice: (id) => set({ selectedVoiceId: id }),

  uploadVoice: async (file, name, description, tags, language) => {
    set({ isLoading: true, error: null });
    try {
      await voicesApi.upload(file, { name, description, tags, language });
      await get().fetchVoices();
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
      throw e;
    }
  },

  updateVoice: async (id, data) => {
    try {
      await voicesApi.update(id, data);
      await get().fetchVoices(undefined, { silent: true });
    } catch (e: any) {
      set({ error: e.message });
      throw e;
    }
  },

  deleteVoice: async (id) => {
    const prevVoices = get().voices;
    try {
      const { selectedVoiceId } = get();
      set({
        voices: prevVoices.filter((v) => v.id !== id),
      });
      if (selectedVoiceId === id) set({ selectedVoiceId: null });
      await voicesApi.delete(id);
      await get().fetchVoices(undefined, { silent: true });
      get().removeVoiceAvatar(id);
    } catch (e: any) {
      set({ voices: prevVoices });
      set({ error: e.message });
      await get().fetchVoices(undefined, { silent: true });
      throw e;
    }
  },

  setVoiceAvatar: (id, dataUrl) => {
    set((s) => {
      const next = { ...s.voiceAvatars, [id]: dataUrl };
      writeVoiceAvatars(next);
      return { voiceAvatars: next };
    });
  },

  removeVoiceAvatar: (id) => {
    set((s) => {
      const next = { ...s.voiceAvatars };
      delete next[id];
      writeVoiceAvatars(next);
      return { voiceAvatars: next };
    });
  },
}));
