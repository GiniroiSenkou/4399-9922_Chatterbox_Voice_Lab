import { cn } from "@/lib/utils";
import { Upload, Music } from "lucide-react";

interface Props {
  getRootProps: () => Record<string, unknown>;
  getInputProps: () => Record<string, unknown>;
  isDragActive: boolean;
  file: File | null;
}

export function VoiceDropZone({ getRootProps, getInputProps, isDragActive, file }: Props) {
  return (
    <div
      {...(getRootProps() as React.HTMLAttributes<HTMLDivElement>)}
      className={cn(
        "relative flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all",
        isDragActive
          ? "border-violet-500 bg-violet-500/5"
          : file
          ? "border-violet-500/50 bg-violet-500/5"
          : "border-default hover:border-white/20 hover:bg-white/3"
      )}
    >
      <input {...(getInputProps() as React.InputHTMLAttributes<HTMLInputElement>)} />
      <div className={cn(
        "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
        isDragActive ? "bg-violet-500/20" : "bg-white/5"
      )}>
        {file ? (
          <Music className="w-6 h-6 text-violet-400" />
        ) : (
          <Upload className="w-6 h-6 text-zinc-500" />
        )}
      </div>

      {file ? (
        <div className="text-center">
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{file.name}</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {(file.size / 1024 / 1024).toFixed(1)} MB
          </p>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {isDragActive ? "Drop your audio here" : "Drag & drop audio"}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            WAV, MP3, FLAC, OGG, M4A (max 50MB)
          </p>
        </div>
      )}
    </div>
  );
}
