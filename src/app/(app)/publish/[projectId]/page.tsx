import { notFound, redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { getProject } from "@/lib/data/projects";
import { PublishForm } from "@/components/create/PublishForm";

export default async function PublishPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const me = await getCurrentProfile();
  if (!me) redirect("/login");

  const project = await getProject(projectId);
  if (!project || project.ownerId !== me.id) notFound();

  return (
    <div className="mx-auto min-h-[100dvh] max-w-lg px-5 pb-28 pt-8 md:pb-10">
      <h1 className="mb-1 font-display text-xl font-semibold">Post to Stoun</h1>
      <p className="mb-6 text-sm text-muted">Share your transformation with the world.</p>
      <PublishForm project={project} />
    </div>
  );
}
