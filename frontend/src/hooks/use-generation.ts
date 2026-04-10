import { useCallback } from "react";
import { useGenerationStore } from "@/stores/generation-store";
import { useVoiceStore } from "@/stores/voice-store";
import { useUIStore } from "@/stores/ui-store";

export function useGeneration() {
  const { generate, generateAB, isGenerating, queue, activeJobProgress, activeJobStage } =
    useGenerationStore();
  const { selectedVoiceId } = useVoiceStore();
  const { addToast } = useUIStore();

  const triggerGenerate = useCallback(async () => {
    if (!selectedVoiceId) {
      addToast({ type: "error", message: "Please select a voice first" });
      return;
    }
    const currentlyGenerating = useGenerationStore.getState().isGenerating;
    await generate();
    if (currentlyGenerating) {
      addToast({ type: "info", message: "Added to generation queue" });
    }
  }, [generate, selectedVoiceId, addToast]);

  const triggerGenerateAB = useCallback(async () => {
    if (!selectedVoiceId) {
      addToast({ type: "error", message: "Please select a voice first" });
      return;
    }
    await generateAB();
  }, [generateAB, selectedVoiceId, addToast]);

  return {
    triggerGenerate,
    triggerGenerateAB,
    isGenerating,
    queueLength: queue.length,
    progress: activeJobProgress,
    stage: activeJobStage,
    canGenerate: !!selectedVoiceId,
  };
}
