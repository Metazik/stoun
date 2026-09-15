import { notFound, redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { getProject, getAudioFile } from "@/lib/data/projects";
import { StudioClient } from "@/components/studio/StudioClient";

export default async function StudioProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const me = await getCurrentProfile();
  if (!me) redirect("/login");

  const project = await getProject(projectId);
  if (!project || project.ownerId !== me.id) notFound();

  const originalAudio = project.originalAudioFileId ? await getAudioFile(project.originalAudioFileId) : null;
  const currentAudio = project.currentAudioFileId ? await getAudioFile(project.currentAudioFileId) : null;

  return (
    <StudioClient
      project={project}
      originalUrl={originalAudio?.url ?? ""}
      currentUrl={currentAudio?.url ?? originalAudio?.url ?? ""}
    />
  );
}
