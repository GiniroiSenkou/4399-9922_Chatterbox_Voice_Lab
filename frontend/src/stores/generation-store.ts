import { create } from "zustand";
import type { Generation } from "@/types/generation";
import { DEFAULT_PARAMS, type GenerationParams, type ModelId } from "@/lib/constants";
import { generateApi } from "@/lib/api";
import { useVoiceStore } from "./voice-store";
import { usePlayerStore } from "./player-store";

interface PendingGeneration {
  id: string;
  text: string;
  voice_id: string;
  model: ModelId;
  params: GenerationParams;
  preset_name?: string | null;
}

interface SelectedPresetRef {
  id: string;
  name: string;
}

interface GenerationStore {
  text: string;
  model: ModelId;
  params: GenerationParams;
  selectedPreset: SelectedPresetRef | null;
  activeJobId: string | null;
  activeJobProgress: number;
  activeJobStage: string;
  isGenerating: boolean;
  queue: PendingGeneration[];
  generations: Generation[];
  error: string | null;
  setText: (text: string) => void;
  setModel: (model: ModelId) => void;
  setParam: (key: string, value: unknown) => void;
  setParams: (params: Partial<GenerationParams>) => void;
  setSelectedPreset: (preset: SelectedPresetRef | null) => void;
  generate: () => Promise<void>;
  generateAB: () => Promise<void>;
  processQueue: () => Promise<void>;
  onJobProgress: (jobId: string, progress: number, stage: string) => void;
  onJobComplete: (jobId: string) => void;
  onJobFailed: (jobId: string, error: string) => void;
  fetchHistory: () => Promise<void>;
  deleteGeneration: (id: string) => Promise<void>;
  deleteAllHistory: () => Promise<void>;
}

export const useGenerationStore = create<GenerationStore>((set, get) => ({
  text: "",
  model: "turbo",
  params: { ...DEFAULT_PARAMS },
  selectedPreset: null,
  activeJobId: null,
  activeJobProgress: 0,
  activeJobStage: "",
  isGenerating: false,
  queue: [],
  generations: [],
  error: null,

  setText: (text) => set({ text }),
  setModel: (model) => set({ model, selectedPreset: null }),
  setParam: (key, value) =>
    set((s) => ({ params: { ...s.params, [key]: value }, selectedPreset: null })),
  setParams: (params) =>
    set((s) => ({ params: { ...s.params, ...params }, selectedPreset: null })),
  setSelectedPreset: (preset) => set({ selectedPreset: preset }),

  generate: async () => {
    const { text, model, params, selectedPreset } = get();
    const voiceId = useVoiceStore.getState().selectedVoiceId;
    if (!voiceId || !text.trim()) return;

    const id = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const queued: PendingGeneration = {
      id,
      text: text.trim(),
      voice_id: voiceId,
      model,
      params: { ...params },
      preset_name: selectedPreset?.name ?? null,
    };

    set((s) => ({ queue: [...s.queue, queued], error: null }));
    await get().processQueue();
  },

  generateAB: async () => {
    const { text, params, selectedPreset } = get();
    const voiceId = useVoiceStore.getState().selectedVoiceId;
    if (!voiceId || !text.trim()) return;
    if (get().isGenerating || get().queue.length > 0) return;

    set({ isGenerating: true, error: null });

    try {
      const res = await generateApi.generateAB({
        text,
        voice_id: voiceId,
        params,
        model_a: "turbo",
        model_b: "multilingual",
        preset_name: selectedPreset?.name ?? null,
      });
      set({ activeJobId: res.data.job_id_a });
    } catch (e: any) {
      set({ isGenerating: false, error: e.message });
    }
  },

  processQueue: async () => {
    const { isGenerating, activeJobId, queue } = get();
    if (isGenerating || activeJobId || queue.length === 0) return;

    const next = queue[0];
    set({ isGenerating: true, error: null, activeJobProgress: 0, activeJobStage: "queued" });

    try {
      const res = await generateApi.generate({
        text: next.text,
        voice_id: next.voice_id,
        model: next.model,
        params: next.params,
        preset_name: next.preset_name ?? null,
      });
      set((s) => ({ activeJobId: res.data.job_id, queue: s.queue.slice(1) }));
    } catch (e: any) {
      set((s) => ({ isGenerating: false, activeJobId: null, error: e.message, queue: s.queue.slice(1) }));
      await get().processQueue();
    }
  },

  onJobProgress: (jobId, progress, stage) => {
    if (get().activeJobId === jobId) {
      set({ activeJobProgress: progress, activeJobStage: stage });
    }
  },

  onJobComplete: (jobId) => {
    set({ isGenerating: false, activeJobId: null, activeJobProgress: 1 });
    // Load audio into player
    const audioUrl = generateApi.getAudioUrl(jobId);
    usePlayerStore.getState().loadAudio(audioUrl);
    // Refresh history then continue queue.
    void (async () => {
      await get().fetchHistory();
      await get().processQueue();
    })();
  },

  onJobFailed: (jobId, error) => {
    if (get().activeJobId === jobId) {
      set({ isGenerating: false, activeJobId: null, error });
      void get().processQueue();
    }
  },

  fetchHistory: async () => {
    try {
      const res = await generateApi.list({ limit: 50 });
      set({ generations: res.data.generations });
    } catch (e: any) {
      console.error("Failed to fetch history:", e);
    }
  },

  deleteGeneration: async (id) => {
    try {
      await generateApi.delete(id);
      set((s) => ({ generations: s.generations.filter((g) => g.id !== id) }));
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  deleteAllHistory: async () => {
    try {
      await generateApi.deleteHistory();
      set((s) => ({
        generations: s.generations.filter((g) => g.status !== "completed"),
      }));
    } catch (e: any) {
      set({ error: e.message });
    }
  },
}));
