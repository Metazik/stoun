/* eslint-disable @typescript-eslint/no-explicit-any -- Supabase row shapes are dynamic */
import { isSupabaseConfigured } from "@/lib/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getDemoDB } from "@/lib/demo/store";
import type {
  AudioFile,
  MusicSettings,
  Project,
  ProjectSource,
  VocalSettings,
} from "@/types";

const DEFAULT_VOCAL: VocalSettings = {
  improved: false,
  pitchCorrected: false,
  timingCorrected: false,
  harmonyAdded: false,
  warmth: 0,
  emotion: 0,
};

const DEFAULT_MUSIC: MusicSettings = {
  activeLayers: [],
  arrangementGenerated: false,
  mastered: false,
};

export type CreateProjectInput = {
  ownerId: string;
  title: string;
  sourceType: ProjectSource;
  tags: string[];
  instruction: string | null;
  /** Where the raw recording/upload/song already lives. Live mode: a Supabase
   * Storage path in `private-projects`. Demo mode: any playable URL (a demo
   * asset, or a client-side blob: URL kept for the current browser session). */
  originalAudioUrl: string;
  originalAudioBucket?: string;
  originalAudioPath?: string;
};

function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  if (!isSupabaseConfigured) {
    const db = getDemoDB();
    const projectId = newId("proj");
    const audioId = newId("audio");

    const audioFile: AudioFile = {
      id: audioId,
      projectId,
      kind: "original",
      label: "Original recording",
      url: input.originalAudioUrl,
      durationSeconds: null,
      isMocked: false,
    };
    db.audioFiles.set(audioId, audioFile);

    const project: Project = {
      id: projectId,
      ownerId: input.ownerId,
      title: input.title,
      sourceType: input.sourceType,
      status: "draft",
      tags: input.tags,
      instruction: input.instruction,
      keepMyVoice: true,
      vocalSettings: DEFAULT_VOCAL,
      musicSettings: DEFAULT_MUSIC,
      originalAudioFileId: audioId,
      currentAudioFileId: audioId,
      remixOfPostId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.projects.set(projectId, project);
    return project;
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) throw new Error("NO_CLIENT");

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      owner_id: input.ownerId,
      title: input.title,
      source_type: input.sourceType,
      tags: input.tags,
      instruction: input.instruction,
    })
    .select("*")
    .single();
  if (projectError || !project) throw new Error(projectError?.message ?? "PROJECT_INSERT_FAILED");

  const { data: audioFile, error: audioError } = await supabase
    .from("audio_files")
    .insert({
      project_id: project.id,
      kind: "original",
      label: "Original recording",
      storage_bucket: input.originalAudioBucket ?? "private-projects",
      storage_path: input.originalAudioPath ?? input.originalAudioUrl,
      is_mocked: false,
    })
    .select("*")
    .single();
  if (audioError || !audioFile) throw new Error(audioError?.message ?? "AUDIO_INSERT_FAILED");

  await supabase
    .from("projects")
    .update({ original_audio_file_id: audioFile.id, current_audio_file_id: audioFile.id })
    .eq("id", project.id);

  return mapProjectRow({ ...project, original_audio_file_id: audioFile.id, current_audio_file_id: audioFile.id });
}

export async function listProjectsByOwner(ownerId: string): Promise<Project[]> {
  if (!isSupabaseConfigured) {
    return Array.from(getDemoDB().projects.values())
      .filter((p) => p.ownerId === ownerId)
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  }
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("owner_id", ownerId)
    .order("updated_at", { ascending: false });
  return (data ?? []).map(mapProjectRow);
}

export async function getProject(projectId: string): Promise<Project | null> {
  if (!isSupabaseConfigured) {
    return getDemoDB().projects.get(projectId) ?? null;
  }
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase.from("projects").select("*").eq("id", projectId).single();
  return data ? mapProjectRow(data) : null;
}

export async function getAudioFile(audioFileId: string): Promise<AudioFile | null> {
  if (!isSupabaseConfigured) {
    return getDemoDB().audioFiles.get(audioFileId) ?? null;
  }
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase.from("audio_files").select("*").eq("id", audioFileId).single();
  if (!data) return null;
  const { data: pub } = supabase.storage.from(data.storage_bucket).getPublicUrl(data.storage_path);
  return mapAudioFileRow(data, pub.publicUrl);
}

export async function updateProjectSettings(
  projectId: string,
  patch: Partial<Pick<Project, "vocalSettings" | "musicSettings" | "keepMyVoice" | "status" | "title">>
): Promise<void> {
  if (!isSupabaseConfigured) {
    const db = getDemoDB();
    const project = db.projects.get(projectId);
    if (!project) throw new Error("NOT_FOUND");
    Object.assign(project, patch, { updatedAt: new Date().toISOString() });
    return;
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) throw new Error("NO_CLIENT");
  const dbPatch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.vocalSettings) dbPatch.vocal_settings = patch.vocalSettings;
  if (patch.musicSettings) dbPatch.music_settings = patch.musicSettings;
  if (patch.keepMyVoice !== undefined) dbPatch.keep_my_voice = patch.keepMyVoice;
  if (patch.status) dbPatch.status = patch.status;
  if (patch.title) dbPatch.title = patch.title;
  await supabase.from("projects").update(dbPatch).eq("id", projectId);
}

export async function setCurrentAudioFile(projectId: string, audioFileId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const project = getDemoDB().projects.get(projectId);
    if (!project) throw new Error("NOT_FOUND");
    project.currentAudioFileId = audioFileId;
    return;
  }
  const supabase = await getSupabaseServerClient();
  if (!supabase) throw new Error("NO_CLIENT");
  await supabase.from("projects").update({ current_audio_file_id: audioFileId }).eq("id", projectId);
}

export async function saveGeneratedAudioFile(
  projectId: string,
  url: string,
  label: string
): Promise<AudioFile> {
  if (!isSupabaseConfigured) {
    const db = getDemoDB();
    const audioId = newId("audio");
    const audioFile: AudioFile = {
      id: audioId,
      projectId,
      kind: "processed",
      label,
      url,
      durationSeconds: 16,
      isMocked: true,
    };
    db.audioFiles.set(audioId, audioFile);
    return audioFile;
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) throw new Error("NO_CLIENT");
  const { data, error } = await supabase
    .from("audio_files")
    .insert({
      project_id: projectId,
      kind: "processed",
      label,
      storage_bucket: "public-posts",
      storage_path: url.replace(/^\//, ""),
      is_mocked: true,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "INSERT_FAILED");
  return mapAudioFileRow(data, url);
}

function mapProjectRow(row: any): Project {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    sourceType: row.source_type,
    status: row.status,
    tags: row.tags ?? [],
    instruction: row.instruction,
    keepMyVoice: row.keep_my_voice,
    vocalSettings: row.vocal_settings ?? DEFAULT_VOCAL,
    musicSettings: row.music_settings ?? DEFAULT_MUSIC,
    originalAudioFileId: row.original_audio_file_id,
    currentAudioFileId: row.current_audio_file_id,
    remixOfPostId: row.remix_of_post_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAudioFileRow(row: any, url: string): AudioFile {
  return {
    id: row.id,
    projectId: row.project_id,
    kind: row.kind,
    label: row.label,
    url,
    durationSeconds: row.duration_seconds,
    isMocked: row.is_mocked,
  };
}
