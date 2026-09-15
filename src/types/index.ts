export type PlanTier = "free" | "pro" | "creator";

export type Profile = {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  plan: PlanTier;
  followerCount: number;
  followingCount: number;
  createdAt: string;
};

export type ProjectSource = "record" | "upload" | "song";
export type ProjectStatus = "draft" | "processing" | "ready" | "published";

export type AudioKind = "original" | "stem" | "processed" | "master";

export type AudioFile = {
  id: string;
  projectId: string;
  kind: AudioKind;
  label: string | null;
  url: string;
  durationSeconds: number | null;
  isMocked: boolean;
};

export type VocalSettings = {
  improved: boolean;
  pitchCorrected: boolean;
  timingCorrected: boolean;
  harmonyAdded: boolean;
  warmth: number; // -1..1
  emotion: number; // -1..1
};

export type MusicLayer = "piano" | "pads" | "drums" | "bass" | "strings";

export type MusicSettings = {
  activeLayers: MusicLayer[];
  arrangementGenerated: boolean;
  mastered: boolean;
};

export type Project = {
  id: string;
  ownerId: string;
  title: string;
  sourceType: ProjectSource;
  status: ProjectStatus;
  tags: string[];
  instruction: string | null;
  keepMyVoice: boolean;
  vocalSettings: VocalSettings;
  musicSettings: MusicSettings;
  originalAudioFileId: string | null;
  currentAudioFileId: string | null;
  remixOfPostId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Post = {
  id: string;
  projectId: string;
  authorId: string;
  author: Profile;
  title: string;
  description: string | null;
  artworkUrl: string | null;
  clipDurationSeconds: 5 | 10 | 15;
  audioUrl: string;
  hashtags: string[];
  remixOfPostId: string | null;
  likeCount: number;
  commentCount: number;
  remixCount: number;
  likedByMe: boolean;
  createdAt: string;
};

export type Comment = {
  id: string;
  postId: string;
  userId: string;
  author: Profile;
  body: string;
  createdAt: string;
};

export const MUSIC_TAGS = [
  "Piano",
  "Soul",
  "R&B",
  "Afrobeat",
  "Arabic",
  "Moroccan",
  "Rock",
  "Acoustic",
  "Cinematic",
  "Sad",
  "Romantic",
  "Energetic",
] as const;

export type MusicTag = (typeof MUSIC_TAGS)[number];
