import { isSupabaseConfigured } from "@/lib/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getDemoDB } from "@/lib/demo/store";
import { getPost } from "@/lib/data/posts";
import { createProject } from "@/lib/data/projects";
import type { Project } from "@/types";

/**
 * Starts a remix: a new private project owned by `userId`, seeded from the
 * original post's audio. The remix engine itself is UI-complete but the
 * actual "blend with my voice" processing is mocked (see src/lib/audio-engine).
 */
export async function createRemixFromPost(originalPostId: string, userId: string): Promise<Project> {
  const original = await getPost(originalPostId);
  if (!original) throw new Error("POST_NOT_FOUND");

  const project = await createProject({
    ownerId: userId,
    title: `${original.title} (Remix)`,
    sourceType: "song",
    tags: [],
    instruction: `Remix of "${original.title}" by @${original.author.username}`,
    originalAudioUrl: original.audioUrl,
  });

  if (!isSupabaseConfigured) {
    const db = getDemoDB();
    const p = db.projects.get(project.id);
    if (p) p.remixOfPostId = originalPostId;
    original.remixCount += 1;
    return { ...project, remixOfPostId: originalPostId };
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) throw new Error("NO_CLIENT");
  await supabase.from("projects").update({ remix_of_post_id: originalPostId }).eq("id", project.id);
  await supabase.from("remixes").insert({
    original_post_id: originalPostId,
    remix_project_id: project.id,
    user_id: userId,
  });

  return { ...project, remixOfPostId: originalPostId };
}
