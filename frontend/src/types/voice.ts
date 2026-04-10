export interface VoiceProfile {
  id: string;
  name: string;
  description: string | null;
  tags: string[] | null;
  original_filename: string | null;
  file_format: string;
  sample_rate: number;
  duration_ms: number;
  language: string | null;
  created_at: string;
  updated_at: string;
}
