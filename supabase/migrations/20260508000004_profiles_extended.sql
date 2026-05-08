-- Add shipping/payment/location fields to profiles
alter table public.profiles
  add column if not exists city             text,
  add column if not exists country          text,
  add column if not exists ships            boolean not null default false,
  add column if not exists shipping_notes   text,
  add column if not exists payment_methods  text[] not null default '{}',
  add column if not exists updated_at       timestamptz not null default now();
