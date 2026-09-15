import { NextResponse } from "next/server";
import { requireCurrentProfile } from "@/lib/auth";
import { getProject, updateProjectSettings } from "@/lib/data/projects";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const me = await requireCurrentProfile();
    const project = await getProject(id);
    if (!project || project.ownerId !== me.id) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    const patch = await req.json();
    await updateProjectSettings(id, patch);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
