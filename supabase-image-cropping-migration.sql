-- Add image metadata for public announcements and event photographs.
-- Existing rows retain their current image URLs and receive a safe default ratio.

alter table public.announcements
  add column if not exists image_url text,
  add column if not exists image_aspect_ratio text not null default '4:3';

alter table public.events
  add column if not exists cover_image_aspect_ratio text not null default '4:3',
  add column if not exists gallery_image_settings jsonb not null default '{}'::jsonb;

-- Keep gallery metadata predictable: it is an object mapping each image URL to
-- one of the crop ratios supported by the admin image editor.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'events_gallery_image_settings_object'
      and conrelid = 'public.events'::regclass
  ) then
    alter table public.events
      add constraint events_gallery_image_settings_object
      check (jsonb_typeof(gallery_image_settings) = 'object');
  end if;
end $$;
