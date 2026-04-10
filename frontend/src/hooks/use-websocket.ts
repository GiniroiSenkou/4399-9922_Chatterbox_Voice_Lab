import { useEffect } from "react";
import { wsClient } from "@/lib/ws";
import { useGenerationStore } from "@/stores/generation-store";
import { useUIStore } from "@/stores/ui-store";

export function useWebSocket() {
  useEffect(() => {
    wsClient.connect();

    const unsub = wsClient.onMessage((msg) => {
      const { type, payload } = msg;
      const genStore = useGenerationStore.getState();
      const uiStore = useUIStore.getState();

      switch (type) {
        case "generation:progress":
          genStore.onJobProgress(
            payload.job_id as string,
            payload.progress as number,
            payload.stage as string
          );
          break;
        case "generation:complete":
          genStore.onJobComplete(payload.job_id as string);
          uiStore.addToast({ type: "success", message: "Generation complete!" });
          break;
        case "generation:failed":
          genStore.onJobFailed(payload.job_id as string, payload.error as string);
          uiStore.addToast({ type: "error", message: `Generation failed: ${payload.error}` });
          break;
        case "engine:model_loading":
          uiStore.addToast({ type: "info", message: `Loading ${payload.model} model…` });
          break;
        case "engine:model_ready":
          uiStore.addToast({ type: "success", message: `${payload.model} model ready` });
          break;
      }
    });

    // Keepalive ping every 30s
    const pingInterval = setInterval(() => wsClient.send("ping"), 30000);

    return () => {
      unsub();
      clearInterval(pingInterval);
      wsClient.disconnect();
    };
  }, []);
}
