"use client";

import { useRef, useState } from "react";
import { UploadCloud, Play, Pause, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCreateStore } from "@/lib/stores/useCreateStore";

export function FileUpload() {
  const setSource = useCreateStore((s) => s.setSource);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  function handleFile(f: File | undefined) {
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  }

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) audio.pause();
    else audio.play();
    setPlaying(!playing);
  }

  return (
    <div className="flex flex-col items-center gap-6 py-10">
      {!file && (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex h-48 w-full max-w-sm flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-surface text-muted transition-colors hover:border-stoun-violet hover:text-foreground"
        >
          <UploadCloud className="h-10 w-10" />
          <span className="text-sm font-medium">Tap to choose an audio file</span>
          <span className="text-xs">MP3, WAV, M4A…</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {file && previewUrl && (
        <div className="flex w-full max-w-xs flex-col items-center gap-4">
          <p className="text-sm font-medium">{file.name}</p>
          <audio ref={audioRef} src={previewUrl} onEnded={() => setPlaying(false)} />
          <button
            onClick={togglePlay}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-raised"
            aria-label={playing ? "Pause" : "Play preview"}
          >
            {playing ? <Pause className="h-6 w-6" /> : <Play className="ml-0.5 h-6 w-6" />}
          </button>
          <div className="flex w-full gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setFile(null);
                setPreviewUrl(null);
              }}
            >
              Choose another
            </Button>
            <Button
              className="flex-1"
              onClick={() => setSource("upload", file, previewUrl, file.name)}
            >
              <Check className="h-4 w-4" /> Use this file
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
