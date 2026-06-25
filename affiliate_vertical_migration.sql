-- Add ai_vertical and template_id to decisions so history page can
-- reconstruct the affiliate CTA without keyword guessing.
--
-- Run once in Supabase SQL Editor.

alter table public.decisions
  add column if not exists ai_vertical text,
  add column if not exists template_id text;
