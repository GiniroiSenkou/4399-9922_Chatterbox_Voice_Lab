export interface WSMessage {
  type: string;
  payload: Record<string, unknown>;
  timestamp: string;
}
