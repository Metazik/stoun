import Link from "next/link";
import { Sparkles, SlidersHorizontal } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth";
import { listProjectsByOwner } from "@/lib/data/projects";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default async function StudioIndexPage() {
  const me = await getCurrentProfile();
  const projects = me ? await listProjectsByOwner(me.id) : [];

  return (
    <div className="mx-auto min-h-[100dvh] max-w-2xl px-5 pb-28 pt-8 md:pb-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold">Studio</h1>
          <p className="text-sm text-muted">Your works in progress.</p>
        </div>
        <Link href="/create">
          <Button size="sm">
            <Sparkles className="h-4 w-4" /> New
          </Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <SlidersHorizontal className="h-8 w-8 text-muted" />
          <p className="font-medium">Nothing in the Studio yet</p>
          <p className="text-sm text-muted">Record, upload, or bring a song to start your first Stoun.</p>
          <Link href="/create">
            <Button className="mt-2">Start creating</Button>
          </Link>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/studio/${p.id}`}
              className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-stoun-violet"
            >
              <div>
                <p className="font-medium">{p.title}</p>
                <p className="text-xs text-muted">
                  {p.status} · {p.tags.join(", ") || "No tags yet"}
                </p>
              </div>
              <span className="rounded-full bg-surface-raised px-3 py-1 text-xs capitalize text-muted">
                {p.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
