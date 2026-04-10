import { create } from "zustand";
import type { TimelineClip, Project } from "@/types/project";
import { projectsApi } from "@/lib/api";

interface TimelineStore {
  currentProject: Project | null;
  projects: Project[];
  selectedClipId: string | null;
  fetchProjects: () => Promise<void>;
  loadProject: (id: string) => Promise<void>;
  createProject: (name: string, description?: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addClip: (data: Record<string, unknown>) => Promise<void>;
  updateClip: (clipId: string, data: Record<string, unknown>) => Promise<void>;
  deleteClip: (clipId: string) => Promise<void>;
  selectClip: (id: string | null) => void;
  reorderClips: (clipIds: string[]) => Promise<void>;
}

export const useTimelineStore = create<TimelineStore>((set, get) => ({
  currentProject: null,
  projects: [],
  selectedClipId: null,

  fetchProjects: async () => {
    const res = await projectsApi.list();
    set({ projects: res.data.projects });
  },

  loadProject: async (id) => {
    const res = await projectsApi.get(id);
    set({ currentProject: res.data });
  },

  createProject: async (name, description) => {
    await projectsApi.create({ name, description });
    await get().fetchProjects();
  },

  deleteProject: async (id) => {
    await projectsApi.delete(id);
    if (get().currentProject?.id === id) set({ currentProject: null });
    await get().fetchProjects();
  },

  addClip: async (data) => {
    const project = get().currentProject;
    if (!project) return;
    await projectsApi.addClip(project.id, data);
    await get().loadProject(project.id);
  },

  updateClip: async (clipId, data) => {
    await projectsApi.updateClip(clipId, data);
    const project = get().currentProject;
    if (project) await get().loadProject(project.id);
  },

  deleteClip: async (clipId) => {
    await projectsApi.deleteClip(clipId);
    const project = get().currentProject;
    if (project) await get().loadProject(project.id);
  },

  selectClip: (id) => set({ selectedClipId: id }),

  reorderClips: async (clipIds) => {
    const project = get().currentProject;
    if (!project) return;
    await projectsApi.reorderClips(project.id, clipIds);
    await get().loadProject(project.id);
  },
}));
