import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { getPost } from "@/lib/data/posts";
import { FeedList } from "@/components/feed/FeedList";

export default async function SinglePostPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  const me = await getCurrentProfile();
  const post = await getPost(postId, me?.id);
  if (!post) notFound();
  return <FeedList posts={[post]} />;
}
