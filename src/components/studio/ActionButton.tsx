"use client";

import { Loader2, Check } from "lucide-react";
import { useState } from "react";
import { useStudioStore } from "@/lib/stores/useStudioStore";
import { cn } from "@/lib/utils";

export function ActionButton({
  action,
  label,
  icon: Icon,
  done,
}: {
  action:
    | "cleanVoice"
    | "correctPitch"
    | "correctTiming"
    | "addHarmony"
    | "generateArrangement"
    | "generateMusic"
    | "masterTrack";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  done?: boolean;
}) {
  const project = useStudioStore((s) => s.project);
  const pendingAction = useStudioStore((s) => s.pendingAction);
  const setPending = useStudioStore((s) => s.setPending);
  const applyResult = useStudioStore((s) => s.applyResult);
  const [justDone, setJustDone] = useState(false);
  const busy = pendingAction === action;

  async function run() {
    if (!project || pendingAction) return;
    setPending(action);
    try {
      const res = await fetch(`/api/projects/${project.id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok) {
        applyResult(data.audioFile.url, data.vocalSettings, data.musicSettings);
        setJustDone(true);
        setTimeout(() => setJustDone(false), 1500);
      } else {
        setPending(null);
      }
    } catch {
      setPending(null);
    }
  }

  return (
    <button
      onClick={run}
      disabled={busy}
      className={cn(
        "flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-colors disabled:opacity-70",
        done ? "border-stoun-violet/60 bg-stoun-violet/10 text-foreground" : "border-border bg-surface hover:border-white/30"
      )}
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : justDone || done ? (
        <Check className="h-4 w-4 text-stoun-violet" />
      ) : (
        <Icon className="h-4 w-4" />
      )}
      {label}
    </button>
  );
}
