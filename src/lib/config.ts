export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * STOUN can run in two modes:
 *  - "live": a real Supabase project is configured (Auth + Postgres + Storage).
 *  - "demo": no credentials are set, so we fall back to an in-memory data
 *    store (see src/lib/demo) seeded with realistic content. This lets the
 *    whole product experience — feed, studio, publishing, social — be
 *    reviewed end to end without provisioning infrastructure first.
 *
 * Every data-access function in src/lib/data branches on this flag. Nothing
 * in the UI layer needs to know which mode is active.
 */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
