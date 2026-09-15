# Stoun

Stoun is a social music app: you start from your **real voice** and Stoun
builds a full production around it (arrangement, harmonies, mix, mastering)
— without ever replacing your voice with a synthetic one. Principle:
**I sing → Stoun understands → Stoun transforms → I publish.**

This repo is the MVP scaffold: a working Next.js + Supabase product, with
every AI audio-processing step abstracted behind a stable `AudioEngine`
interface that is currently **mocked** (see below).

## Architecture

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS.
  Client state (feed player, Studio session, multi-step Create wizard) uses
  Zustand. Feed transitions and sheets use Framer Motion.
- **Backend**: Next.js Route Handlers — no separate service for the MVP.
- **Data**: Supabase Postgres, with Row Level Security everywhere (see
  `supabase/migrations/0001_init.sql`). Two Storage buckets:
  `public-posts` (published clips/artwork, public) and `private-projects`
  (raw recordings and in-progress work, owner-only via RLS).
- **AudioEngine** (`src/lib/audio-engine`): the single seam between the
  product and real audio AI. Every function — `analyzeVoice`,
  `separateVocals`, `cleanVoice`, `correctPitch`, `correctTiming`,
  `generateArrangement`, `generateMusic`, `addHarmony`, `masterTrack` — has
  a stable signature (URLs + metadata in, URLs + metadata out) and is
  called the same way whether it's mocked or real.

### Demo mode (no infrastructure required)

If `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are not set,
the whole app runs on an in-memory data store (`src/lib/demo/store.ts`)
seeded with a few artists and posts, and a fixed "you" demo user — no
login required. This is what lets the full experience (feed → create →
studio → publish → social) be reviewed with just `npm install && npm run
dev`. Every function in `src/lib/data/*` branches on `isSupabaseConfigured`
and is the *only* place that knows which mode is active; nothing in the UI
layer does. Demo-mode data resets when the server process restarts — it is
a review aid, not a database.

To run against a real Supabase project instead: create one, run the SQL in
`supabase/migrations/0001_init.sql` (SQL editor or `supabase db push`), and
set the two env vars above (see `.env.local.example`).

## What's real vs. mocked in this MVP

**Real:**
- Auth (Supabase Auth), Postgres schema + RLS, Storage buckets and upload
  paths, the full social graph (likes/comments/follows/remix records),
  publishing pipeline, and the Studio/Create/Publish UI and state machine.
- The A/B "Original vs Stoun" player plays two genuinely different,
  independently synthesized audio files (see `scripts/generate-demo-audio.mjs`)
  — it is not two copies of the same file.
- Voice recording (`MediaRecorder`) and file upload are real; the captured
  audio is what plays back as "ORIGINAL" in the Studio.

**Mocked (clearly marked `// MOCK` in `src/lib/audio-engine/index.ts`):**
- No real voice separation, pitch/timing correction, arrangement
  generation, or mastering happens. Each mock still returns a real,
  listenable result (never silence, never a spinner that goes nowhere): it
  picks one of five pre-rendered demo tracks based on the project's style
  tags, simulates realistic processing latency, and updates the same
  metadata a real call would.
- Swapping in real services later means only touching
  `src/lib/audio-engine/index.ts` — each function names the real service it
  should call (Demucs/LALAL.AI, a Melodyne-equivalent, Suno API
  instrumental mode, LANDR). No caller changes.
- Monetization (FREE/PRO/CREATOR) has a `subscriptions` table and a `plan`
  column on profiles, but no Stripe wiring — by design, per the product
  brief, until the core experience is validated.

## Key technical risks

1. **Audio pipeline latency & cost** once real AI services are wired in —
   voice separation + arrangement generation are the slowest and most
   expensive steps. The mocked `AudioEngine` already simulates latency so
   the UI's loading states are exercised honestly, but real p95 latency
   should be measured early.
2. **Storage growth**: every Studio action that "changes" the audio creates
   a new `audio_files` row (never overwrites in place), which is correct
   for undo/compare but will need a retention/cleanup policy once real
   (large) processed files replace the small demo assets.
3. **RLS correctness**: private `projects`/`audio_files` become readable
   the moment a `posts` row references them (by design, for public
   playback) — any future feature that copies audio between projects must
   preserve this boundary rather than widening it.
4. **MediaRecorder browser support/formats** (Safari vs Chrome codecs) will
   need real-device testing before this ships broadly.

## Project structure

```
src/
  app/
    (auth)/login, (auth)/signup        — Supabase Auth pages
    (app)/feed                         — vertical swipeable feed (HOME)
    (app)/create                       — Record / Upload / Song + tags wizard
    (app)/studio, (app)/studio/[id]    — Studio: AVANT/APRÈS, Vocal, Music, Keep My Voice
    (app)/publish/[projectId]          — Post to Stoun
    (app)/profile/[username]           — profile + grid of creations
    (app)/p/[postId]                   — single-post deep link
    api/                               — route handlers (posts, projects, social, audio-engine calls)
  components/{ui,feed,studio,create,profile}
  lib/
    audio-engine/                      — the mocked AI abstraction
    data/                              — Supabase-or-demo data access layer
    demo/                              — in-memory demo store
    stores/                            — Zustand stores (player, create wizard, studio)
    supabase/                          — browser/server client factories
supabase/migrations/0001_init.sql      — full schema + RLS + storage policies
scripts/generate-demo-audio.mjs        — generates the demo WAV files in public/audio/demo
```

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000 — you'll land in the feed as the demo user with
no setup required. To try the full validation flow described in the
product brief: **Create → Record → pick a style tag → Studio (try the AI
buttons, compare ORIGINAL vs STOUN VERSION) → Post to Stoun → see it in the
feed.**
