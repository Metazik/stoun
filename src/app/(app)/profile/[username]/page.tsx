import { notFound } from "next/navigation";
import Link from "next/link";
import { Play } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth";
import { getProfileByUsername, isFollowing } from "@/lib/data/profiles";
import { listPostsByAuthor } from "@/lib/data/posts";
import { Avatar } from "@/components/ui/Avatar";
import { ProfileActions } from "@/components/profile/ProfileActions";
import { formatCount } from "@/lib/utils";

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const me = await getCurrentProfile();
  const profile = await getProfileByUsername(username);
  if (!profile) notFound();

  const [posts, following] = await Promise.all([
    listPostsByAuthor(profile.id, me?.id),
    me && me.id !== profile.id ? isFollowing(me.id, profile.id) : Promise.resolve(false),
  ]);

  return (
    <div className="mx-auto min-h-[100dvh] max-w-2xl px-5 pb-28 pt-8 md:pb-10">
      <div className="flex flex-col items-center gap-4 text-center">
        <Avatar src={profile.avatarUrl} name={profile.displayName} size={92} />
        <div>
          <h1 className="font-display text-xl font-semibold">{profile.displayName}</h1>
          <p className="text-sm text-muted">@{profile.username}</p>
        </div>
        {profile.bio && <p className="max-w-sm text-sm text-foreground/90">{profile.bio}</p>}

        <div className="flex gap-6 text-sm">
          <div>
            <p className="font-semibold">{formatCount(posts.length)}</p>
            <p className="text-muted">Creations</p>
          </div>
          <div>
            <p className="font-semibold">{formatCount(profile.followerCount)}</p>
            <p className="text-muted">Followers</p>
          </div>
          <div>
            <p className="font-semibold">{formatCount(profile.followingCount)}</p>
            <p className="text-muted">Following</p>
          </div>
        </div>

        <ProfileActions isSelf={me?.id === profile.id} targetUserId={profile.id} initiallyFollowing={following} />
      </div>

      <div className="mt-10">
        <h2 className="mb-3 text-sm font-semibold text-muted">Creations</h2>
        {posts.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">No creations published yet.</p>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/p/${post.id}`}
                className="group relative flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-stoun-gradient"
              >
                {post.artworkUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.artworkUrl} alt={post.title} className="h-full w-full object-cover" />
                ) : (
                  <span className="px-2 text-center text-xs font-medium text-white/90">{post.title}</span>
                )}
                <span className="absolute bottom-1 right-1 flex items-center gap-0.5 rounded-full bg-black/40 px-1.5 py-0.5 text-[10px] text-white">
                  <Play className="h-2.5 w-2.5" fill="white" /> {formatCount(post.likeCount)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
