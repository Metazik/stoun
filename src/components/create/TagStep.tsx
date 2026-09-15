"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tag } from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";
import { useCreateStore } from "@/lib/stores/useCreateStore";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { MUSIC_TAGS } from "@/types";

function extensionFor(blob: Blob) {
  if (blob.type.includes("wav")) return "wav";
  if (blob.type.includes("mp3") || blob.type.includes("mpeg")) return "mp3";
  if (blob.type.includes("webm")) return "webm";
  return "audio";
}

export function TagStep() {
  const router = useRouter();
  const { sourceType, blob, previewUrl, sourceLabel, tags, instruction, toggleTag, setInstruction, goTo } =
    useCreateStore();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!sourceType || !blob) return;
    setSubmitting(true);
    setError(null);

    try {
      let originalAudioUrl = previewUrl ?? "";
      let originalAudioBucket: string | undefined;
      let originalAudioPath: string | undefined;

      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }
        const path = `${user.id}/${crypto.randomUUID()}.${extensionFor(blob)}`;
        const { error: uploadError } = await supabase.storage
          .from("private-projects")
          .upload(path, blob, { contentType: blob.type || "audio/webm" });
        if (uploadError) throw new Error(uploadError.message);
        originalAudioBucket = "private-projects";
        originalAudioPath = path;
        const { data: pub } = supabase.storage.from("private-projects").getPublicUrl(path);
        originalAudioUrl = pub.publicUrl;
      }

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType,
          tags,
          instruction: instruction || null,
          originalAudioUrl,
          originalAudioBucket,
          originalAudioPath,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not create your project.");
      }
      const { project } = await res.json();
      router.push(`/studio/${project.id}`);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 py-6">
      {sourceLabel && (
        <div className="rounded-xl border border-border bg-surface px-4 py-3 text-sm">
          <span className="text-muted">Source: </span>
          <span className="font-medium">{sourceLabel}</span>
        </div>
      )}

      <div>
        <p className="mb-3 text-sm font-semibold">Pick a musical direction</p>
        <div className="flex flex-wrap gap-2">
          {MUSIC_TAGS.map((tag) => (
            <Tag key={tag} active={tags.includes(tag)} onClick={() => toggleTag(tag)}>
              {tag}
            </Tag>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">Anything specific? (optional)</p>
        <textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder='e.g. "Warmer verses, big chorus, add strings at the end"'
          rows={3}
          className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-stoun-violet"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => goTo(2)}>
          Back
        </Button>
        <Button className="flex-1" disabled={submitting} onClick={handleSubmit}>
          {submitting ? "Sending to Studio…" : "Continue to Studio"}
        </Button>
      </div>
    </div>
  );
}
