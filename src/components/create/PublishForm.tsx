"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Project } from "@/types";

const DURATIONS: (5 | 10 | 15)[] = [5, 10, 15];

export function PublishForm({ project }: { project: Project }) {
  const router = useRouter();
  const [title, setTitle] = useState(project.title === "Untitled Stoun" ? "" : project.title);
  const [description, setDescription] = useState("");
  const [hashtagInput, setHashtagInput] = useState(project.tags.map((t) => t.toLowerCase()).join(" "));
  const [duration, setDuration] = useState<5 | 10 | 15>(15);
  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const [artworkPreview, setArtworkPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Give your Stoun a title.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      let artworkUrl: string | null = null;
      if (artworkFile) {
        const supabase = getSupabaseBrowserClient();
        if (supabase) {
          const path = `${project.id}/${Date.now()}-${artworkFile.name}`;
          const { error: uploadError } = await supabase.storage
            .from("public-posts")
            .upload(path, artworkFile, { contentType: artworkFile.type });
          if (!uploadError) {
            artworkUrl = supabase.storage.from("public-posts").getPublicUrl(path).data.publicUrl;
          }
        } else {
          artworkUrl = artworkPreview;
        }
      }

      const hashtags = hashtagInput
        .split(/[\s,#]+/)
        .map((h) => h.trim().toLowerCase())
        .filter(Boolean);

      const res = await fetch(`/api/projects/${project.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          artworkUrl,
          clipDurationSeconds: duration,
          hashtags,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not publish.");
      }
      router.push("/feed");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-sm font-semibold">Clip length</p>
        <div className="flex gap-2">
          {DURATIONS.map((d) => (
            <Tag key={d} active={duration === d} onClick={() => setDuration(d)}>
              {d}s
            </Tag>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="flex h-40 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-surface text-muted hover:border-stoun-violet"
      >
        {artworkPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={artworkPreview} alt="Artwork preview" className="h-full w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-2 text-sm">
            <ImagePlus className="h-6 w-6" /> Add artwork (optional)
          </span>
        )}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            setArtworkFile(f);
            setArtworkPreview(URL.createObjectURL(f));
          }
        }}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Name your Stoun"
          className="rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-stoun-violet"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Tell people about this Stoun…"
          className="resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-stoun-violet"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted">Hashtags</label>
        <input
          value={hashtagInput}
          onChange={(e) => setHashtagInput(e.target.value)}
          placeholder="soul keepmyvoice newartist"
          className="rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-stoun-violet"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button type="submit" size="lg" disabled={submitting}>
        {submitting ? "Publishing…" : "Post to Stoun"}
      </Button>
    </form>
  );
}
