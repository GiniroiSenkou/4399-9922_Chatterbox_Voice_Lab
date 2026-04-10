import axios from "axios";

const api = axios.create({
  baseURL: "/api/v1",
  timeout: 300000, // 5 minutes for generation
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.detail || err.response?.data?.message || err.message || "Unknown error";
    console.error("[API Error]", message);
    return Promise.reject(new Error(message));
  }
);

// Voices
export const voicesApi = {
  list: (params?: { search?: string; offset?: number; limit?: number }) =>
    api.get("/voices", { params }),

  get: (id: string) => api.get(`/voices/${id}`),

  upload: (file: File, data: { name: string; description?: string; tags?: string[]; language?: string }) => {
    const form = new FormData();
    form.append("file", file);
    form.append("name", data.name);
    if (data.description) form.append("description", data.description);
    if (data.tags) form.append("tags", JSON.stringify(data.tags));
    if (data.language) form.append("language", data.language);
    return api.post("/voices", form, { headers: { "Content-Type": "multipart/form-data" } });
  },

  update: (id: string, data: Record<string, unknown>) => api.patch(`/voices/${id}`, data),

  delete: (id: string) => api.delete(`/voices/${id}`),

  getAudioUrl: (id: string) => `/api/v1/voices/${id}/audio`,

  getWaveform: (id: string) => api.get(`/voices/${id}/waveform`),
};

// Generation
export const generateApi = {
  generate: (data: {
    text: string;
    voice_id: string;
    model: string;
    params: Record<string, unknown>;
    preset_name?: string | null;
  }) => api.post("/generate", data),

  generateAB: (data: {
    text: string;
    voice_id: string;
    params: Record<string, unknown>;
    model_a?: string;
    model_b?: string;
    preset_name?: string | null;
  }) => api.post("/generate/ab", data),

  get: (jobId: string) => api.get(`/generate/${jobId}`),

  getAudioUrl: (jobId: string) => `/api/v1/generate/${jobId}/audio`,

  list: (params?: { offset?: number; limit?: number }) =>
    api.get("/generations", { params }),

  delete: (id: string) => api.delete(`/generations/${id}`),

  deleteHistory: () => api.delete("/generations"),
};

// Presets
export const presetsApi = {
  list: () => api.get("/presets"),
  create: (data: Record<string, unknown>) => api.post("/presets", data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/presets/${id}`, data),
  delete: (id: string) => api.delete(`/presets/${id}`),
};

// Projects
export const projectsApi = {
  list: () => api.get("/projects"),
  get: (id: string) => api.get(`/projects/${id}`),
  create: (data: { name: string; description?: string }) => api.post("/projects", data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  addClip: (projectId: string, data: Record<string, unknown>) =>
    api.post(`/projects/${projectId}/clips`, data),
  updateClip: (clipId: string, data: Record<string, unknown>) =>
    api.patch(`/projects/clips/${clipId}`, data),
  deleteClip: (clipId: string) => api.delete(`/projects/clips/${clipId}`),
  reorderClips: (projectId: string, clipIds: string[]) =>
    api.post(`/projects/${projectId}/reorder`, clipIds),
};

// Audio
export const audioApi = {
  getUrl: (filename: string) => `/api/v1/audio/${filename}`,
  convertUrl: (genId: string, format: string) => `/api/v1/audio/convert/${genId}?format=${format}`,
};

export default api;
