-- Enable required extensions
create extension if not exists "pg_trgm";

-- ============================================================
-- PROFILES
-- ============================================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique not null,
  avatar_url  text,
  bio         text,
  created_at  timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- LISTINGS
-- ============================================================
create table public.listings (
  id            uuid primary key default gen_random_uuid(),
  seller_id     uuid not null references public.profiles(id) on delete cascade,
  card_id       text not null,
  card_name     text not null,
  card_image_url text,
  set_code      text,
  set_name      text,
  rarity        text,
  condition     text not null check (condition in ('NM','LP','MP','HP','DMG')),
  price         numeric(10,2) not null check (price > 0),
  quantity      int not null default 1 check (quantity > 0),
  description   text,
  status        text not null default 'active' check (status in ('active','sold','inactive')),
  search_vector tsvector generated always as (
    to_tsvector('english', coalesce(card_name, '') || ' ' || coalesce(set_name, ''))
  ) stored,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index listings_search_idx on public.listings using gin(search_vector);
create index listings_seller_idx on public.listings(seller_id);
create index listings_status_idx on public.listings(status);
create index listings_card_id_idx on public.listings(card_id);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger listings_updated_at
  before update on public.listings
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- CONVERSATIONS
-- ============================================================
create table public.conversations (
  id              uuid primary key default gen_random_uuid(),
  listing_id      uuid references public.listings(id) on delete set null,
  buyer_id        uuid not null references public.profiles(id) on delete cascade,
  seller_id       uuid not null references public.profiles(id) on delete cascade,
  last_message_at timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  constraint no_self_message check (buyer_id <> seller_id)
);

create index conversations_buyer_idx  on public.conversations(buyer_id);
create index conversations_seller_idx on public.conversations(seller_id);

-- ============================================================
-- MESSAGES
-- ============================================================
create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  body            text not null check (char_length(body) > 0),
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);

create index messages_conversation_idx on public.messages(conversation_id, created_at);

-- Update last_message_at on new message
create or replace function public.update_conversation_last_message()
returns trigger language plpgsql security definer as $$
begin
  update public.conversations
  set last_message_at = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger messages_update_conversation
  after insert on public.messages
  for each row execute procedure public.update_conversation_last_message();

-- ============================================================
-- REVIEWS
-- ============================================================
create table public.reviews (
  id           uuid primary key default gen_random_uuid(),
  listing_id   uuid not null references public.listings(id) on delete cascade,
  reviewer_id  uuid not null references public.profiles(id) on delete cascade,
  seller_id    uuid not null references public.profiles(id) on delete cascade,
  rating       int not null check (rating between 1 and 5),
  comment      text,
  created_at   timestamptz not null default now(),
  constraint one_review_per_listing unique (listing_id, reviewer_id)
);

create index reviews_seller_idx   on public.reviews(seller_id);
create index reviews_reviewer_idx on public.reviews(reviewer_id);
