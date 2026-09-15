import { NextResponse } from "next/server";
import { requireCurrentProfile } from "@/lib/auth";
import { addComment, listComments } from "@/lib/data/social";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const comments = await listComments(id);
  return NextResponse.json({ comments });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const me = await requireCurrentProfile();
    const { body } = await req.json();
    if (typeof body !== "string" || !body.trim()) {
      return NextResponse.json({ error: "Comment can't be empty." }, { status: 400 });
    }
    const comment = await addComment(id, me.id, body);
    return NextResponse.json({ comment });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
