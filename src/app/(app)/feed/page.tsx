import { FeedList } from "@/components/feed/FeedList";
import { listFeedPosts } from "@/lib/data/posts";
import { getCurrentProfile } from "@/lib/auth";

export default async function FeedPage() {
  const me = await getCurrentProfile();
  const posts = await listFeedPosts(me?.id);
  return <FeedList posts={posts} />;
}
