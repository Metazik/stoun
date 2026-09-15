"use client";

import { useRef, useState } from "react";
import { Music2, Play, Pause, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCreateStore } from "@/lib/stores/useCreateStore";
import { cn } from "@/lib/utils";

const DEMO_SONGS = [
  { id: "song-a", title: "Acoustic take — voice memo", url: "/audio/demo/original-vocal.wav" },
];

export function SongPicker() {
  const setSource = useCreateStore((s) => s.setSource);
  const [selected, setSelected] = useState<string | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  function togglePlay(song: (typeof DEMO_SONGS)[number]) {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing === song.id) {
      audio.pause();
      setPlaying(null);
      return;
    }
    audio.src = song.url;
    audio.play();
    setPlaying(song.id);
  }

  async function pickSong(song: (typeof DEMO_SONGS)[number]) {
    setLoading(true);
    const res = await fetch(song.url);
    const blob = await res.blob();
    setLoading(false);
    setSource("song", blob, song.url, song.title);
  }

  return (
    <div className="flex flex-col gap-3 py-6">
      <audio ref={audioRef} onEnded={() => setPlaying(null)} />
      {DEMO_SONGS.map((song) => (
        <button
          key={song.id}
          onClick={() => setSelected(song.id)}
          className={cn(
            "flex items-center gap-4 rounded-2xl border p-4 text-left transition-colors",
            selected === song.id ? "border-stoun-violet bg-surface-raised" : "border-border bg-surface"
          )}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stoun-gradient">
            <Music2 className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{song.title}</p>
            <p className="text-xs text-muted">Existing recording</p>
          </div>
          <span
            role="button"
            onClick={(e) => {
              e.stopPropagation();
              togglePlay(song);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-raised"
          >
            {playing === song.id ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
          </span>
        </button>
      ))}
      <p className="text-xs text-muted">
        More sources (Spotify import, past uploads) coming soon — pick the sample above to try the flow.
      </p>
      <Button
        disabled={!selected || loading}
        className="mt-2"
        onClick={() => {
          const song = DEMO_SONGS.find((s) => s.id === selected);
          if (song) pickSong(song);
        }}
      >
        <Check className="h-4 w-4" /> {loading ? "Loading…" : "Use this song"}
      </Button>
    </div>
  );
}
