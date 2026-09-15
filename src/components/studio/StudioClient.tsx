"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStudioStore } from "@/lib/stores/useStudioStore";
import { ABPlayer } from "@/components/studio/ABPlayer";
import { VocalPanel } from "@/components/studio/VocalPanel";
import { MusicPanel } from "@/components/studio/MusicPanel";
import { KeepMyVoiceBadge } from "@/components/studio/KeepMyVoiceBadge";
import { Button } from "@/components/ui/Button";
import { Send } from "lucide-react";
import type { Project } from "@/types";

export function StudioClient({
  project,
  originalUrl,
  currentUrl,
}: {
  project: Project;
  originalUrl: string;
  currentUrl: string;
}) {
  const router = useRouter();
  const init = useStudioStore((s) => s.init);
  const [title, setTitle] = useState(project.title);
  const storeProject = useStudioStore((s) => s.project);

  useEffect(() => {
    init(project, originalUrl, currentUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  function saveTitle() {
    if (title === project.title) return;
    fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    }).catch(() => {});
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-2xl flex-col gap-5 px-5 pb-28 pt-4 md:pb-10">
      <KeepMyVoiceBadge />

      <div className="flex items-center justify-between gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveTitle}
          className="flex-1 bg-transparent font-display text-xl font-semibold outline-none"
        />
        <Button size="sm" onClick={() => router.push(`/publish/${project.id}`)} disabled={!storeProject}>
          <Send className="h-4 w-4" /> Post to Stoun
        </Button>
      </div>

      <ABPlayer />
      <VocalPanel />
      <MusicPanel />
    </div>
  );
}
