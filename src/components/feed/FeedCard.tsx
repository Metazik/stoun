"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Repeat2, Sparkles, Play, Pause } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { CommentSheet } from "@/components/feed/CommentSheet";
import { cn, formatCount } from "@/lib/utils";
import type { Post } from "@/types";

const GRADIENTS = [
  "from-violet-600 via-fuchsia-600 to-orange-500",
  "from-indigo-600 via-purple-600 to-pink-500",
  "from-amber-500 via-orange-600 to-rose-600",
  "from-emerald-600 via-teal-600 to-cyan-600",
  "from-rose-600 via-red-600 to-orange-500",
];

function gradientFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}

export function FeedCard({
  post,
  isActive,
  onFollowedChange,
}: {
  post: Post;
  isActive: boolean;
  onFollowedChange?: (following: boolean) => void;
}) {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [liked, setLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [following, setFollowing] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [burst, setBurst] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isActive) {
      audio.currentTime = 0;
      audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      audio.pause();
      setPlaying(false);
    }
  }, [isActive]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  }

  async function toggleLike() {
    setLiked((v) => !v);
    setLikeCount((c) => c + (liked ? -1 : 1));
    if (!liked) {
      setBurst(true);
      setTimeout(() => setBurst(false), 700);
    }
    await fetch(`/api/posts/${post.id}/like`, { method: "POST" }).catch(() => {});
  }

  async function toggleFollow() {
    setFollowing((v) => !v);
    onFollowedChange?.(!following);
    await fetch("/api/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: post.authorId }),
    }).catch(() => {});
  }

  async function startRemix() {
    const res = await fetch("/api/remix", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: post.id }),
    });
    if (res.ok) {
      const { project } = await res.json();
      router.push(`/studio/${project.id}`);
    }
  }

  return (
    <section className="relative flex h-[100dvh] w-full snap-start items-stretch justify-center overflow-hidden">
      <div className={cn("absolute inset-0 bg-gradient-to-br", gradientFor(post.id))} />
      <div className="absolute inset-0 bg-black/35" />
      <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-32 h-64 w-64 rounded-full bg-black/30 blur-3xl" />

      <audio
        ref={audioRef}
        src={post.audioUrl}
        loop
        onTimeUpdate={(e) => {
          const el = e.currentTarget;
          setProgress(el.duration ? el.currentTime / el.duration : 0);
        }}
      />

      <button
        onClick={togglePlay}
        aria-label={playing ? "Pause" : "Play"}
        className="absolute inset-0 z-10 flex items-center justify-center"
      >
        {!playing && (
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-black/40 backdrop-blur-md">
            <Play className="ml-1 h-9 w-9 text-white" fill="white" />
          </span>
        )}
      </button>

      {burst && (
        <motion.div
          initial={{ scale: 0.4, opacity: 1 }}
          animate={{ scale: 1.6, opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
        >
          <Heart className="h-32 w-32 text-white" fill="white" />
        </motion.div>
      )}

      {/* Right action rail */}
      <div className="safe-bottom absolute bottom-24 right-3 z-20 flex flex-col items-center gap-5 md:bottom-10">
        <button onClick={toggleLike} className="flex flex-col items-center gap-1 active:scale-90" aria-label="Like">
          <Heart className={cn("h-8 w-8 drop-shadow", liked ? "text-stoun-coral" : "text-white")} fill={liked ? "currentColor" : "none"} strokeWidth={2} />
          <span className="text-xs font-medium text-white drop-shadow">{formatCount(likeCount)}</span>
        </button>
        <button
          onClick={() => setCommentsOpen(true)}
          className="flex flex-col items-center gap-1 active:scale-90"
          aria-label="Comments"
        >
          <MessageCircle className="h-8 w-8 text-white drop-shadow" strokeWidth={2} />
          <span className="text-xs font-medium text-white drop-shadow">{formatCount(commentCount)}</span>
        </button>
        <button onClick={startRemix} className="flex flex-col items-center gap-1 active:scale-90" aria-label="Remix">
          <Repeat2 className="h-8 w-8 text-white drop-shadow" strokeWidth={2} />
          <span className="text-xs font-medium text-white drop-shadow">{formatCount(post.remixCount)}</span>
        </button>
        <Link
          href="/create"
          className="flex flex-col items-center gap-1 active:scale-90"
          aria-label="Create with Stoun"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-stoun-gradient shadow-glow">
            <Sparkles className="h-5 w-5 text-white" />
          </span>
          <span className="text-[10px] font-medium text-white drop-shadow">Create</span>
        </Link>
      </div>

      {/* Bottom info */}
      <div className="safe-bottom absolute inset-x-0 bottom-16 z-20 px-4 pr-16 md:bottom-6">
        <Link href={`/profile/${post.author.username}`} className="mb-3 flex items-center gap-2.5">
          <Avatar src={post.author.avatarUrl} name={post.author.displayName} size={38} className="ring-2 ring-white/70" />
          <span className="text-sm font-semibold text-white drop-shadow">@{post.author.username}</span>
          {!following && (
            <button
              onClick={(e) => {
                e.preventDefault();
                toggleFollow();
              }}
              className="ml-1 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md"
            >
              Follow
            </button>
          )}
        </Link>
        <p className="text-base font-semibold text-white drop-shadow">{post.title}</p>
        {post.description && (
          <p className="mt-1 line-clamp-2 text-sm text-white/85 drop-shadow">{post.description}</p>
        )}
        {post.hashtags.length > 0 && (
          <p className="mt-1 text-sm text-white/70">{post.hashtags.map((h) => `#${h}`).join(" ")}</p>
        )}
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 h-1 bg-white/10">
        <div className="h-full bg-white transition-[width]" style={{ width: `${progress * 100}%` }} />
      </div>

      <button
        onClick={togglePlay}
        className="absolute right-3 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md safe-top md:top-6"
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
      </button>

      <CommentSheet
        postId={post.id}
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        onCommentAdded={() => setCommentCount((c) => c + 1)}
      />
    </section>
  );
}
