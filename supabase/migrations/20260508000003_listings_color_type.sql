-- Add color and card_type columns omitted from the initial schema
alter table public.listings
  add column if not exists color text[] not null default '{}',
  add column if not exists card_type text;
