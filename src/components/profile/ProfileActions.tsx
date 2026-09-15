"use client";

import { useState } from "react";
import Link from "next/link";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function ProfileActions({
  isSelf,
  targetUserId,
  initiallyFollowing,
}: {
  isSelf: boolean;
  targetUserId: string;
  initiallyFollowing: boolean;
}) {
  const [following, setFollowing] = useState(initiallyFollowing);
  const [copied, setCopied] = useState(false);

  async function toggleFollow() {
    setFollowing((v) => !v);
    await fetch("/api/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId }),
    }).catch(() => {});
  }

  async function share() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  if (isSelf) {
    return (
      <Link href="/studio">
        <Button variant="outline" size="sm">
          Manage my creations
        </Button>
      </Link>
    );
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" variant={following ? "secondary" : "primary"} onClick={toggleFollow}>
        {following ? "Following" : "Follow"}
      </Button>
      <Button size="sm" variant="outline">
        Message
      </Button>
      <Button size="sm" variant="ghost" onClick={share} aria-label="Share profile">
        <Share2 className="h-4 w-4" /> {copied ? "Copied" : ""}
      </Button>
    </div>
  );
}
