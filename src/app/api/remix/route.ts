import { NextResponse } from "next/server";
import { requireCurrentProfile } from "@/lib/auth";
import { createRemixFromPost } from "@/lib/data/remix";

export async function POST(req: Request) {
  try {
    const me = await requireCurrentProfile();
    const { postId } = await req.json();
    if (typeof postId !== "string") {
      return NextResponse.json({ error: "postId is required." }, { status: 400 });
    }
    const project = await createRemixFromPost(postId, me.id);
    return NextResponse.json({ project });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
