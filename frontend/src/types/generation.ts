export interface Generation {
  id: string;
  voice_id: string;
  text: string;
  model: string;
  params: Record<string, unknown> | null;
  output_path: string | null;
  duration_ms: number;
  processing_time_ms: number;
  seed_used: number | null;
  status: "queued" | "processing" | "completed" | "failed";
  error_message: string | null;
  ab_pair_id: string | null;
  created_at: string;
}

export interface Preset {
  id: string;
  name: string;
  description: string | null;
  model: string;
  params: Record<string, unknown>;
  is_default: boolean;
  created_at: string;
}
