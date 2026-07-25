-- Social Content Studio (ADR-023): AI-drafted social posts for X and Bluesky,
-- planned on a rolling calendar and managed in the owner-only admin studio.
-- Phase 1 has no social-media APIs — drafts are copied out and published by
-- hand, so this table is pure planning state.
--
-- Access: service-role only. RLS is enabled with NO policies — the anon and
-- authenticated roles can neither read nor write; every access goes through
-- the owner-gated admin routes (lib/admin/analytics-access.ts).

create table public.social_drafts (
  id uuid primary key default gen_random_uuid(),
  -- When the founder intends to post it (UTC), and which daily slot it fills.
  scheduled_for timestamptz not null,
  slot text not null check (slot in ('morning', 'afternoon')),
  -- Shared brief -----------------------------------------------------------
  pillar text not null check (
    pillar in (
      'golfGoals',
      'audienceSpotlights',
      'golfJourney',
      'founderUpdates',
      'educational',
      'brandMission'
    )
  ),
  -- Audience slug from lib/content/audiences.ts (spotlight posts only).
  audience text,
  objective text not null default '',
  cta text not null default '',
  -- Image recommendation ----------------------------------------------------
  image_type text not null default 'none'
    check (image_type in ('none', 'branded', 'lifestyle')),
  -- Prompt for a future image-generation phase (lifestyle) — prompts only in
  -- Phase 1, by design.
  image_prompt text,
  -- Short line rendered on a branded graphic (branded) — e.g. the tagline.
  branded_text text,
  -- Platform copy -----------------------------------------------------------
  x_copy text not null default '',
  bluesky_copy text not null default '',
  networks text[] not null default '{x,bluesky}',
  -- Workflow: draft → ai_generated → edited → approved → published.
  status text not null default 'draft' check (
    status in ('draft', 'ai_generated', 'edited', 'approved', 'published')
  ),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.social_drafts is
  'Social Content Studio drafts (ADR-023). Service-role only; owner-gated admin UI.';

create index social_drafts_scheduled_for_idx
  on public.social_drafts (scheduled_for);

alter table public.social_drafts enable row level security;
-- Deliberately no RLS policies: service-role access only.
