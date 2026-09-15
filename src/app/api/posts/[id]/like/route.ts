import { NextResponse } from "next/server";
import { requireCurrentProfile } from "@/lib/auth";
import { toggleLike } from "@/lib/data/social";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const me = await requireCurrentProfile();
    const result = await toggleLike(id, me.id);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
