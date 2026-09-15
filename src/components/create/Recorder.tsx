"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, Play, Pause, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCreateStore } from "@/lib/stores/useCreateStore";
import { cn } from "@/lib/utils";

export function Recorder() {
  const setSource = useCreateStore((s) => s.setSource);
  const [status, setStatus] = useState<"idle" | "recording" | "recorded" | "error">("idle");
  const [seconds, setSeconds] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  async function startRecording() {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setPreviewUrl(URL.createObjectURL(blob));
        setStatus("recorded");
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setStatus("recording");
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setStatus("error");
      setErrorMsg("Microphone access was denied. Check your browser permissions.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
    setPlaying(!playing);
  }

  function useThisTake() {
    if (!previewUrl) return;
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    setSource("record", blob, previewUrl, `Recording — ${seconds}s`);
  }

  return (
    <div className="flex flex-col items-center gap-6 py-10">
      <div
        className={cn(
          "flex h-36 w-36 items-center justify-center rounded-full border-4 transition-all",
          status === "recording" ? "border-stoun-coral animate-pulse-slow" : "border-border"
        )}
      >
        <button
          onClick={status === "recording" ? stopRecording : startRecording}
          disabled={status === "recorded"}
          aria-label={status === "recording" ? "Stop recording" : "Start recording"}
          className={cn(
            "flex h-24 w-24 items-center justify-center rounded-full transition-colors",
            status === "recording" ? "bg-stoun-coral" : "bg-stoun-gradient"
          )}
        >
          {status === "recording" ? (
            <Square className="h-8 w-8 text-white" fill="white" />
          ) : (
            <Mic className="h-9 w-9 text-white" />
          )}
        </button>
      </div>

      <p className="font-mono text-2xl tabular-nums">
        {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}
      </p>

      {status === "idle" && <p className="text-sm text-muted">Tap to start recording your voice</p>}
      {status === "recording" && <p className="text-sm text-stoun-coral">Recording… tap to stop</p>}
      {errorMsg && <p className="text-sm text-red-400">{errorMsg}</p>}

      {status === "recorded" && previewUrl && (
        <div className="flex w-full max-w-xs flex-col items-center gap-4">
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
                setStatus("idle");
                setPreviewUrl(null);
                setSeconds(0);
              }}
            >
              Re-record
            </Button>
            <Button className="flex-1" onClick={useThisTake}>
              <Check className="h-4 w-4" /> Use this take
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
