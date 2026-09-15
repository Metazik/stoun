import { isSupabaseConfigured } from "@/lib/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getDemoDB } from "@/lib/demo/store";
import { getProject, getAudioFile, updateProjectSettings } from "@/lib/data/projects";
import type { Post } from "@/types";

export type PublishInput = {
  projectId: string;
  authorId: string;
  title: string;
  description: string | null;
  artworkUrl: string | null;
  clipDurationSeconds: 5 | 10 | 15;
  hashtags: string[];
};

export async function publishProject(input: PublishInput): Promise<Post> {
  const project = await getProject(input.projectId);
  if (!project) throw new Error("PROJECT_NOT_FOUND");
  const audioFileId = project.currentAudioFileId ?? project.originalAudioFileId;
  if (!audioFileId) throw new Error("NO_AUDIO");
  const audioFile = await getAudioFile(audioFileId);
  if (!audioFile) throw new Error("AUDIO_NOT_FOUND");

  if (!isSupabaseConfigured) {
    const db = getDemoDB();
    const author = db.profiles.get(input.authorId);
    if (!author) throw new Error("AUTHOR_NOT_FOUND");
    const postId = `post_${Math.random().toString(36).slice(2, 10)}`;
    const post: Post = {
      id: postId,
      projectId: project.id,
      authorId: input.authorId,
      author,
      title: input.title,
      description: input.description,
      artworkUrl: input.artworkUrl,
      clipDurationSeconds: input.clipDurationSeconds,
      audioUrl: audioFile.url,
      hashtags: input.hashtags,
      remixOfPostId: project.remixOfPostId,
      likeCount: 0,
      commentCount: 0,
      remixCount: 0,
      likedByMe: false,
      createdAt: new Date().toISOString(),
    };
    db.posts.set(postId, post);
    await updateProjectSettings(project.id, { status: "published" });
    return post;
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) throw new Error("NO_CLIENT");

  const { data, error } = await supabase
    .from("posts")
    .insert({
      project_id: project.id,
      author_id: input.authorId,
      title: input.title,
      description: input.description,
      artwork_url: input.artworkUrl,
      clip_duration_seconds: input.clipDurationSeconds,
      audio_file_id: audioFileId,
      hashtags: input.hashtags,
      remix_of_post_id: project.remixOfPostId,
    })
    .select("id, created_at")
    .single();
  if (error || !data) throw new Error(error?.message ?? "PUBLISH_FAILED");

  await updateProjectSettings(project.id, { status: "published" });

  const { data: authorRow } = await supabase.from("profiles").select("*").eq("id", input.authorId).single();

  return {
    id: data.id,
    projectId: project.id,
    authorId: input.authorId,
    author: {
      id: authorRow.id,
      username: authorRow.username,
      displayName: authorRow.display_name ?? authorRow.username,
      bio: authorRow.bio,
      avatarUrl: authorRow.avatar_url,
      plan: authorRow.plan ?? "free",
      followerCount: 0,
      followingCount: 0,
      createdAt: authorRow.created_at,
    },
    title: input.title,
    description: input.description,
    artworkUrl: input.artworkUrl,
    clipDurationSeconds: input.clipDurationSeconds,
    audioUrl: audioFile.url,
    hashtags: input.hashtags,
    remixOfPostId: project.remixOfPostId,
    likeCount: 0,
    commentCount: 0,
    remixCount: 0,
    likedByMe: false,
    createdAt: data.created_at,
  };
}
