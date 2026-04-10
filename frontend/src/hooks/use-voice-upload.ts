import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useVoiceStore } from "@/stores/voice-store";
import { useUIStore } from "@/stores/ui-store";

const ACCEPTED_TYPES = {
  "audio/wav": [".wav"],
  "audio/mpeg": [".mp3"],
  "audio/flac": [".flac"],
  "audio/ogg": [".ogg"],
  "audio/mp4": [".m4a"],
  "audio/webm": [".webm"],
  "audio/aac": [".aac"],
};

export function useVoiceUpload(onSuccess?: () => void) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { uploadVoice, fetchVoices } = useVoiceStore();
  const { addToast } = useUIStore();

  const normalizeUploadError = (message: string) => {
    const m = message.toLowerCase();
    if ((m.includes("5 second") || m.includes("5s")) && m.includes("prompt")) {
      return "Voice prompt is too short. Upload at least 5 seconds of clear speech.";
    }
    if (m.includes("too short")) {
      return "Voice clip is too short after processing. Use 5-60 seconds of clear speech with less silence.";
    }
    return message;
  };

  const upload = useCallback(
    async (file: File, name: string, description?: string, tags?: string[], language?: string) => {
      setUploading(true);
      setProgress(0);
      try {
        await uploadVoice(file, name, description, tags, language);
        // One extra silent refresh helps if DB commit/indexing finishes right after the first fetch.
        setTimeout(() => {
          void fetchVoices(undefined, { silent: true });
        }, 1200);
        addToast({ type: "success", message: `Voice "${name}" uploaded successfully` });
        onSuccess?.();
      } catch (e: any) {
        addToast({ type: "error", message: normalizeUploadError(e.message || "Upload failed") });
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [uploadVoice, fetchVoices, addToast, onSuccess]
  );

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
    onDropRejected: (files) => {
      const err = files[0]?.errors[0];
      addToast({ type: "error", message: err?.message || "File rejected" });
    },
  });

  return { upload, uploading, progress, getRootProps, getInputProps, isDragActive, acceptedFiles };
}
