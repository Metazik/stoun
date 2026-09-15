"use client";

import { useEffect, useRef, useState } from "react";
import { FeedCard } from "@/components/feed/FeedCard";
import type { Post } from "@/types";

export function FeedList({ posts }: { posts: Post[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(posts[0]?.id ?? null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            setActiveId(entry.target.getAttribute("data-post-id"));
          }
        }
      },
      { root: container, threshold: [0.6] }
    );
    const cards = container.querySelectorAll("[data-post-id]");
    cards.forEach((c) => observer.observe(c));
    return () => observer.disconnect();
  }, [posts]);

  if (posts.length === 0) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-lg font-semibold">No Stouns yet</p>
        <p className="text-sm text-muted">Be the first to publish a transformation.</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="no-scrollbar h-[100dvh] w-full snap-y snap-mandatory overflow-y-scroll">
      {posts.map((post) => (
        <div key={post.id} data-post-id={post.id}>
          <FeedCard post={post} isActive={post.id === activeId} />
        </div>
      ))}
    </div>
  );
}
