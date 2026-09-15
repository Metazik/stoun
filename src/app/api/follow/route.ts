import { NextResponse } from "next/server";
import { requireCurrentProfile } from "@/lib/auth";
import { toggleFollow } from "@/lib/data/social";

export async function POST(req: Request) {
  try {
    const me = await requireCurrentProfile();
    const { targetUserId } = await req.json();
    if (typeof targetUserId !== "string") {
      return NextResponse.json({ error: "targetUserId is required." }, { status: 400 });
    }
    const result = await toggleFollow(me.id, targetUserId);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
