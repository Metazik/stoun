/* eslint-disable @typescript-eslint/no-explicit-any -- Supabase row shapes are dynamic joins */
import { isSupabaseConfigured } from "@/lib/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getDemoDB } from "@/lib/demo/store";
import { mapProfileRow } from "@/lib/data/mappers";
import type { Post } from "@/types";

export async function listFeedPosts(viewerId?: string): Promise<Post[]> {
  if (!isSupabaseConfigured) {
    const db = getDemoDB();
    const uid = viewerId ?? db.currentUserId;
    return Array.from(db.posts.values())
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .map((p) => ({ ...p, likedByMe: db.likes.has(`${p.id}:${uid}`) }));
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("posts")
    .select(
      `id, project_id, author_id, title, description, artwork_url, clip_duration_seconds,
       hashtags, remix_of_post_id, created_at,
       audio_files!posts_audio_file_id_fkey ( storage_bucket, storage_path ),
       profiles!posts_author_id_fkey ( id, username, display_name, avatar_url, bio, plan, created_at ),
       likes ( user_id ),
       comments ( id ),
       remixes ( id )`
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) return [];

  return data.map((row: any) => {
    const { data: pub } = supabase.storage
      .from(row.audio_files.storage_bucket)
      .getPublicUrl(row.audio_files.storage_path);
    return {
      id: row.id,
      projectId: row.project_id,
      authorId: row.author_id,
      author: mapProfileRow(row.profiles),
      title: row.title,
      description: row.description,
      artworkUrl: row.artwork_url,
      clipDurationSeconds: row.clip_duration_seconds,
      audioUrl: pub.publicUrl,
      hashtags: row.hashtags ?? [],
      remixOfPostId: row.remix_of_post_id,
      likeCount: row.likes?.length ?? 0,
      commentCount: row.comments?.length ?? 0,
      remixCount: row.remixes?.length ?? 0,
      likedByMe: viewerId ? row.likes?.some((l: any) => l.user_id === viewerId) : false,
      createdAt: row.created_at,
    } satisfies Post;
  });
}

export async function getPost(postId: string, viewerId?: string): Promise<Post | null> {
  const posts = await listFeedPosts(viewerId);
  return posts.find((p) => p.id === postId) ?? null;
}

export async function listPostsByAuthor(authorId: string, viewerId?: string): Promise<Post[]> {
  const posts = await listFeedPosts(viewerId);
  return posts.filter((p) => p.authorId === authorId);
}
