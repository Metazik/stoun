import { isSupabaseConfigured } from "@/lib/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getDemoDB } from "@/lib/demo/store";
import { mapProfileRow } from "@/lib/data/mappers";
import type { Profile } from "@/types";

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  if (!isSupabaseConfigured) {
    const db = getDemoDB();
    return Array.from(db.profiles.values()).find((p) => p.username === username) ?? null;
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;

  const { data } = await supabase.from("profiles").select("*").eq("username", username).single();
  if (!data) return null;

  const [{ count: followerCount }, { count: followingCount }] = await Promise.all([
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", data.id),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", data.id),
  ]);

  return mapProfileRow(data, followerCount ?? 0, followingCount ?? 0);
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  if (!isSupabaseConfigured) {
    const db = getDemoDB();
    return db.follows.has(`${followerId}:${followingId}`);
  }
  const supabase = await getSupabaseServerClient();
  if (!supabase) return false;
  const { data } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();
  return Boolean(data);
}
