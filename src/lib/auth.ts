import { isSupabaseConfigured } from "@/lib/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getDemoDB } from "@/lib/demo/store";
import type { Profile } from "@/types";
import { mapProfileRow } from "@/lib/data/mappers";

/** The signed-in user's profile, or null. In demo mode this is always "you" (u1). */
export async function getCurrentProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured) {
    const db = getDemoDB();
    return db.profiles.get(db.currentUserId) ?? null;
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!data) return null;

  const [{ count: followerCount }, { count: followingCount }] = await Promise.all([
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", user.id),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", user.id),
  ]);

  return mapProfileRow(data, followerCount ?? 0, followingCount ?? 0);
}

export async function requireCurrentProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("UNAUTHENTICATED");
  return profile;
}
