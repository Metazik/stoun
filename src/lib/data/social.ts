/* eslint-disable @typescript-eslint/no-explicit-any -- Supabase row shapes are dynamic */
import { isSupabaseConfigured } from "@/lib/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getDemoDB } from "@/lib/demo/store";
import { mapProfileRow } from "@/lib/data/mappers";
import type { Comment } from "@/types";

export async function toggleLike(postId: string, userId: string): Promise<{ liked: boolean }> {
  if (!isSupabaseConfigured) {
    const db = getDemoDB();
    const key = `${postId}:${userId}`;
    const post = db.posts.get(postId);
    if (!post) throw new Error("NOT_FOUND");
    if (db.likes.has(key)) {
      db.likes.delete(key);
      post.likeCount = Math.max(0, post.likeCount - 1);
      return { liked: false };
    }
    db.likes.add(key);
    post.likeCount += 1;
    return { liked: true };
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) throw new Error("NO_CLIENT");

  const { data: existing } = await supabase
    .from("likes")
    .select("*")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", userId);
    return { liked: false };
  }
  await supabase.from("likes").insert({ post_id: postId, user_id: userId });
  return { liked: true };
}

export async function toggleFollow(
  followerId: string,
  followingId: string
): Promise<{ following: boolean }> {
  if (followerId === followingId) throw new Error("SELF_FOLLOW");

  if (!isSupabaseConfigured) {
    const db = getDemoDB();
    const key = `${followerId}:${followingId}`;
    const follower = db.profiles.get(followerId);
    const target = db.profiles.get(followingId);
    if (db.follows.has(key)) {
      db.follows.delete(key);
      if (follower) follower.followingCount = Math.max(0, follower.followingCount - 1);
      if (target) target.followerCount = Math.max(0, target.followerCount - 1);
      return { following: false };
    }
    db.follows.add(key);
    if (follower) follower.followingCount += 1;
    if (target) target.followerCount += 1;
    return { following: true };
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) throw new Error("NO_CLIENT");

  const { data: existing } = await supabase
    .from("follows")
    .select("*")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();

  if (existing) {
    await supabase.from("follows").delete().eq("follower_id", followerId).eq("following_id", followingId);
    return { following: false };
  }
  await supabase.from("follows").insert({ follower_id: followerId, following_id: followingId });
  return { following: true };
}

export async function listComments(postId: string): Promise<Comment[]> {
  if (!isSupabaseConfigured) {
    const db = getDemoDB();
    return Array.from(db.comments.values())
      .filter((c) => c.postId === postId)
      .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("comments")
    .select("id, post_id, user_id, body, created_at, profiles!comments_user_id_fkey(*)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  return (data ?? []).map((row: any) => ({
    id: row.id,
    postId: row.post_id,
    userId: row.user_id,
    author: mapProfileRow(row.profiles),
    body: row.body,
    createdAt: row.created_at,
  }));
}

export async function addComment(postId: string, userId: string, body: string): Promise<Comment> {
  const trimmed = body.trim().slice(0, 500);
  if (!trimmed) throw new Error("EMPTY_COMMENT");

  if (!isSupabaseConfigured) {
    const db = getDemoDB();
    const post = db.posts.get(postId);
    const author = db.profiles.get(userId);
    if (!post || !author) throw new Error("NOT_FOUND");
    const comment: Comment = {
      id: `comment_${Date.now()}`,
      postId,
      userId,
      author,
      body: trimmed,
      createdAt: new Date().toISOString(),
    };
    db.comments.set(comment.id, comment);
    post.commentCount += 1;
    return comment;
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) throw new Error("NO_CLIENT");
  const { data, error } = await supabase
    .from("comments")
    .insert({ post_id: postId, user_id: userId, body: trimmed })
    .select("id, post_id, user_id, body, created_at, profiles!comments_user_id_fkey(*)")
    .single();
  if (error || !data) throw new Error(error?.message ?? "INSERT_FAILED");

  return {
    id: data.id,
    postId: data.post_id,
    userId: data.user_id,
    author: mapProfileRow(data.profiles),
    body: data.body,
    createdAt: data.created_at,
  };
}
