"use client";

import { useEffect } from "react";
import { Mic, UploadCloud, Music2, ChevronLeft } from "lucide-react";
import { useCreateStore } from "@/lib/stores/useCreateStore";
import { Recorder } from "@/components/create/Recorder";
import { FileUpload } from "@/components/create/FileUpload";
import { SongPicker } from "@/components/create/SongPicker";
import { TagStep } from "@/components/create/TagStep";
import type { ProjectSource } from "@/types";
import { cn } from "@/lib/utils";

const SOURCES: { type: ProjectSource; label: string; hint: string; icon: typeof Mic }[] = [
  { type: "record", label: "Record", hint: "Sing straight into your mic", icon: Mic },
  { type: "upload", label: "Upload", hint: "Bring an audio file", icon: UploadCloud },
  { type: "song", label: "Song", hint: "Use an existing recording", icon: Music2 },
];

export default function CreatePage() {
  const { step, sourceType, goTo, reset } = useCreateStore();

  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto min-h-[100dvh] max-w-lg px-5 pb-28 pt-8 md:pb-10">
      <div className="mb-6 flex items-center gap-3">
        {step > 1 && (
          <button
            onClick={() => goTo(step === 3 ? 2 : 1)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        <div>
          <h1 className="font-display text-xl font-semibold">Create</h1>
          <p className="text-sm text-muted">Step {step} of 3</p>
        </div>
      </div>

      {step === 1 && (
        <div className="flex flex-col gap-3">
          {SOURCES.map(({ type, label, hint, icon: Icon }) => (
            <button
              key={type}
              onClick={() => useCreateStore.setState({ sourceType: type, step: 2 })}
              className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-5 text-left transition-colors hover:border-stoun-violet"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-stoun-gradient">
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-semibold">{label}</p>
                <p className="text-sm text-muted">{hint}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className={cn("rounded-2xl border border-border bg-surface/40 p-4")}>
          {sourceType === "record" && <Recorder />}
          {sourceType === "upload" && <FileUpload />}
          {sourceType === "song" && <SongPicker />}
        </div>
      )}

      {step === 3 && <TagStep />}
    </div>
  );
}
