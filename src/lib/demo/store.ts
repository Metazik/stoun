// DEMO MODE — in-memory data store used when no Supabase project is configured.
// This is not a database: it resets whenever the server process restarts. It
// exists purely so the full STOUN product experience (feed, studio, publish,
// social) can be reviewed without provisioning infrastructure first. Every
// function here is called only from src/lib/data/*, which is the single
// place that decides "demo vs live".
import type {
  AudioFile,
  Comment,
  MusicSettings,
  Post,
  Profile,
  Project,
  VocalSettings,
} from "@/types";

type DemoDB = {
  profiles: Map<string, Profile>;
  projects: Map<string, Project>;
  audioFiles: Map<string, AudioFile>;
  posts: Map<string, Post>;
  comments: Map<string, Comment>;
  likes: Set<string>; // `${postId}:${userId}`
  follows: Set<string>; // `${followerId}:${followingId}`
  currentUserId: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __STOUN_DEMO_DB__: DemoDB | undefined;
}

const DEMO_AUDIO_BASE = "/audio/demo";

function id(prefix: string, n: number) {
  return `${prefix}_${n}`;
}

function seed(): DemoDB {
  const profiles = new Map<string, Profile>();
  const projects = new Map<string, Project>();
  const audioFiles = new Map<string, AudioFile>();
  const posts = new Map<string, Post>();
  const comments = new Map<string, Comment>();

  const seedProfiles: Profile[] = [
    {
      id: "u1",
      username: "you",
      displayName: "You",
      bio: "Exploring my voice on Stoun.",
      avatarUrl: null,
      plan: "free",
      followerCount: 12,
      followingCount: 8,
      createdAt: new Date().toISOString(),
    },
    {
      id: "u2",
      username: "leila.sings",
      displayName: "Leila",
      bio: "Soul & R&B from Casablanca.",
      avatarUrl: null,
      plan: "pro",
      followerCount: 4820,
      followingCount: 132,
      createdAt: new Date().toISOString(),
    },
    {
      id: "u3",
      username: "yassine_oud",
      displayName: "Yassine",
      bio: "Oud player turned pop producer.",
      avatarUrl: null,
      plan: "creator",
      followerCount: 15300,
      followingCount: 60,
      createdAt: new Date().toISOString(),
    },
    {
      id: "u4",
      username: "nadia.k",
      displayName: "Nadia K.",
      bio: "Cinematic ballads.",
      avatarUrl: null,
      plan: "free",
      followerCount: 980,
      followingCount: 210,
      createdAt: new Date().toISOString(),
    },
  ];
  for (const p of seedProfiles) profiles.set(p.id, p);

  const defaultVocal: VocalSettings = {
    improved: true,
    pitchCorrected: true,
    timingCorrected: false,
    harmonyAdded: false,
    warmth: 0.2,
    emotion: 0.1,
  };
  const defaultMusic: MusicSettings = {
    activeLayers: ["piano", "bass"],
    arrangementGenerated: true,
    mastered: true,
  };

  const seedPosts: {
    postId: string;
    authorId: string;
    title: string;
    description: string;
    tags: string[];
    audioFile: string;
    hashtags: string[];
  }[] = [
    {
      postId: "p1",
      authorId: "u2",
      title: "Sahra (Stoun Version)",
      description: "Recorded in my bedroom, Stoun added the warmth.",
      tags: ["Soul", "R&B"],
      audioFile: "stoun-piano-soul.wav",
      hashtags: ["soul", "keepmyvoice", "newartist"],
    },
    {
      postId: "p2",
      authorId: "u3",
      title: "Nights in Marrakech",
      description: "Afrobeat groove built around a voice memo.",
      tags: ["Afrobeat", "Moroccan"],
      audioFile: "stoun-afrobeat.wav",
      hashtags: ["afrobeat", "morocco", "groove"],
    },
    {
      postId: "p3",
      authorId: "u4",
      title: "Where You Left Me",
      description: "Cinematic strings under a raw vocal take.",
      tags: ["Cinematic", "Sad"],
      audioFile: "stoun-cinematic.wav",
      hashtags: ["cinematic", "ballad"],
    },
    {
      postId: "p4",
      authorId: "u2",
      title: "Golden Hour",
      description: "My favorite Stoun transformation so far.",
      tags: ["Romantic", "Piano"],
      audioFile: "stoun-default.wav",
      hashtags: ["piano", "romantic"],
    },
  ];

  seedPosts.forEach((sp, i) => {
    const projectId = id("proj", i + 1);
    const originalAudioId = id("audio_orig", i + 1);
    const processedAudioId = id("audio_proc", i + 1);

    audioFiles.set(originalAudioId, {
      id: originalAudioId,
      projectId,
      kind: "original",
      label: "Original recording",
      url: `${DEMO_AUDIO_BASE}/original-vocal.wav`,
      durationSeconds: 16,
      isMocked: true,
    });
    audioFiles.set(processedAudioId, {
      id: processedAudioId,
      projectId,
      kind: "master",
      label: "Stoun version",
      url: `${DEMO_AUDIO_BASE}/${sp.audioFile}`,
      durationSeconds: 16,
      isMocked: true,
    });

    projects.set(projectId, {
      id: projectId,
      ownerId: sp.authorId,
      title: sp.title,
      sourceType: "record",
      status: "published",
      tags: sp.tags,
      instruction: null,
      keepMyVoice: true,
      vocalSettings: defaultVocal,
      musicSettings: defaultMusic,
      originalAudioFileId: originalAudioId,
      currentAudioFileId: processedAudioId,
      remixOfPostId: null,
      createdAt: new Date(Date.now() - (i + 1) * 86_400_000).toISOString(),
      updatedAt: new Date(Date.now() - (i + 1) * 86_400_000).toISOString(),
    });

    const author = profiles.get(sp.authorId)!;
    posts.set(sp.postId, {
      id: sp.postId,
      projectId,
      authorId: sp.authorId,
      author,
      title: sp.title,
      description: sp.description,
      artworkUrl: null,
      clipDurationSeconds: 15,
      audioUrl: `${DEMO_AUDIO_BASE}/${sp.audioFile}`,
      hashtags: sp.hashtags,
      remixOfPostId: null,
      likeCount: 20 + i * 37,
      commentCount: i + 1,
      remixCount: i,
      likedByMe: false,
      createdAt: new Date(Date.now() - (i + 1) * 86_400_000).toISOString(),
    });

    comments.set(id("comment", i + 1), {
      id: id("comment", i + 1),
      postId: sp.postId,
      userId: "u1",
      author: profiles.get("u1")!,
      body: "This is beautiful. Love that it's really your voice.",
      createdAt: new Date(Date.now() - i * 3_600_000).toISOString(),
    });
  });

  return {
    profiles,
    projects,
    audioFiles,
    posts,
    comments,
    likes: new Set(),
    follows: new Set(["u1:u2", "u1:u3"]),
    currentUserId: "u1",
  };
}

export function getDemoDB(): DemoDB {
  if (!globalThis.__STOUN_DEMO_DB__) {
    globalThis.__STOUN_DEMO_DB__ = seed();
  }
  return globalThis.__STOUN_DEMO_DB__;
}
