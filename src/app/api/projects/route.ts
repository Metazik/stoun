import { NextResponse } from "next/server";
import { requireCurrentProfile } from "@/lib/auth";
import { createProject } from "@/lib/data/projects";
import type { ProjectSource } from "@/types";

export async function POST(req: Request) {
  try {
    const me = await requireCurrentProfile();
    const body = await req.json();
    const { sourceType, tags, instruction, originalAudioUrl, originalAudioBucket, originalAudioPath } = body as {
      sourceType: ProjectSource;
      tags: string[];
      instruction: string | null;
      originalAudioUrl: string;
      originalAudioBucket?: string;
      originalAudioPath?: string;
    };

    if (!sourceType || !originalAudioUrl) {
      return NextResponse.json({ error: "sourceType and originalAudioUrl are required." }, { status: 400 });
    }

    const project = await createProject({
      ownerId: me.id,
      title: "Untitled Stoun",
      sourceType,
      tags: Array.isArray(tags) ? tags : [],
      instruction: instruction || null,
      originalAudioUrl,
      originalAudioBucket,
      originalAudioPath,
    });

    return NextResponse.json({ project });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
