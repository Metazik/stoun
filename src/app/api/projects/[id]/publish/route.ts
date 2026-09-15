import { NextResponse } from "next/server";
import { requireCurrentProfile } from "@/lib/auth";
import { getProject } from "@/lib/data/projects";
import { publishProject } from "@/lib/data/publish";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const me = await requireCurrentProfile();
    const project = await getProject(id);
    if (!project || project.ownerId !== me.id) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    const { title, description, artworkUrl, clipDurationSeconds, hashtags } = await req.json();
    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }
    if (![5, 10, 15].includes(clipDurationSeconds)) {
      return NextResponse.json({ error: "Invalid clip duration." }, { status: 400 });
    }
    const post = await publishProject({
      projectId: id,
      authorId: me.id,
      title,
      description: description || null,
      artworkUrl: artworkUrl || null,
      clipDurationSeconds,
      hashtags: Array.isArray(hashtags) ? hashtags : [],
    });
    return NextResponse.json({ post });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
