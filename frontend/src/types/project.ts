export interface TimelineClip {
  id: string;
  project_id: string;
  voice_id: string | null;
  generation_id: string | null;
  text: string;
  model: string;
  params: Record<string, unknown> | null;
  order_index: number;
  track: number;
  start_ms: number;
  speaker_label: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  settings: Record<string, unknown> | null;
  clips: TimelineClip[];
  created_at: string;
  updated_at: string;
}
