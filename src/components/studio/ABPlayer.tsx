"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { useStudioStore } from "@/lib/stores/useStudioStore";
import { cn } from "@/lib/utils";

const BAR_COUNT = 28;

function EqualizerBars({ playing }: { playing: boolean }) {
  const heights = useRef(Array.from({ length: BAR_COUNT }, () => 20 + Math.random() * 60));
  return (
    <div className="flex h-16 items-end justify-center gap-1">
      {heights.current.map((h, i) => (
        <span
          key={i}
          className={cn(
            "w-1.5 rounded-full bg-white/80",
            playing ? "animate-pulse-slow" : ""
          )}
          style={{
            height: playing ? `${h}%` : "12%",
            animationDelay: `${i * 60}ms`,
            transition: "height 0.4s ease",
          }}
        />
      ))}
    </div>
  );
}

export function ABPlayer() {
  const { originalUrl, currentUrl } = useStudioStore();
  const [mode, setMode] = useState<"original" | "stoun">("stoun");
  const [playing, setPlaying] = useState(false);
  const originalRef = useRef<HTMLAudioElement>(null);
  const stounRef = useRef<HTMLAudioElement>(null);

  const activeRef = mode === "original" ? originalRef : stounRef;
  const inactiveRef = mode === "original" ? stounRef : originalRef;

  useEffect(() => {
    // Reload the "Stoun version" element whenever the current mix changes.
    if (stounRef.current) {
      const t = stounRef.current.currentTime;
      stounRef.current.load();
      stounRef.current.currentTime = t;
      if (playing && mode === "stoun") stounRef.current.play();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUrl]);

  function switchMode(next: "original" | "stoun") {
    if (next === mode) return;
    const from = mode === "original" ? originalRef.current : stounRef.current;
    const to = next === "original" ? originalRef.current : stounRef.current;
    const t = from?.currentTime ?? 0;
    setMode(next);
    if (to) {
      to.currentTime = t;
      if (playing) to.play();
    }
    from?.pause();
  }

  function togglePlay() {
    const el = activeRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      el.play();
      setPlaying(true);
    }
    inactiveRef.current?.pause();
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-stoun-violet-dark/40 to-black p-6">
      <audio ref={originalRef} src={originalUrl} onEnded={() => setPlaying(false)} />
      <audio ref={stounRef} src={currentUrl} onEnded={() => setPlaying(false)} />

      <div className="mb-4 flex items-center justify-center gap-1 rounded-full bg-black/30 p-1">
        <button
          onClick={() => switchMode("original")}
          className={cn(
            "flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
            mode === "original" ? "bg-white text-black" : "text-white/70"
          )}
        >
          ORIGINAL
        </button>
        <button
          onClick={() => switchMode("stoun")}
          className={cn(
            "flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
            mode === "stoun" ? "bg-stoun-gradient text-white" : "text-white/70"
          )}
        >
          STOUN VERSION
        </button>
      </div>

      <EqualizerBars playing={playing} />

      <div className="mt-4 flex items-center justify-center">
        <button
          onClick={togglePlay}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-black shadow-glow"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause className="h-7 w-7" /> : <Play className="ml-1 h-7 w-7" />}
        </button>
      </div>
      <p className="mt-3 text-center text-xs text-white/60">
        Same recording, {mode === "original" ? "before" : "after"} Stoun.
      </p>
    </div>
  );
}
