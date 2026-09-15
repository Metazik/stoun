import type { Profile } from "@/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function mapProfileRow(row: any, followerCount = 0, followingCount = 0): Profile {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name ?? row.username,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    plan: row.plan ?? "free",
    followerCount,
    followingCount,
    createdAt: row.created_at,
  };
}
