import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Sentinel bucket name for AudioEngine mock outputs, which are static files
 * bundled with the app under public/audio/demo — never actually uploaded to
 * Supabase Storage. Resolving them just returns the app-relative path as-is.
 */
export const LOCAL_ASSET_BUCKET = "local-demo";

/**
 * Turns a (bucket, path) pair from `audio_files` into a URL a browser can
 * actually play. `public-posts` is a public bucket (getPublicUrl works
 * unauthenticated); `private-projects` is owner-only, so it needs a signed
 * URL instead — getPublicUrl on a private bucket returns a URL that 404s.
 */
export async function resolveAudioUrl(
  supabase: SupabaseClient,
  bucket: string,
  path: string
): Promise<string> {
  if (bucket === LOCAL_ASSET_BUCKET || path.startsWith("/") || path.startsWith("http")) {
    return path;
  }
  if (bucket === "public-posts") {
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60);
  if (error || !data) return "";
  return data.signedUrl;
}
