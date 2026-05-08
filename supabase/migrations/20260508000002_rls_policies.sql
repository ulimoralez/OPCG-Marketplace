-- ============================================================
-- Enable Row Level Security on all tables
-- ============================================================
alter table public.profiles     enable row level security;
alter table public.listings     enable row level security;
alter table public.conversations enable row level security;
alter table public.messages     enable row level security;
alter table public.reviews      enable row level security;

-- ============================================================
-- PROFILES policies
-- ============================================================
create policy "profiles_public_read"
  on public.profiles for select using (true);

create policy "profiles_owner_update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ============================================================
-- LISTINGS policies
-- ============================================================
create policy "listings_public_read"
  on public.listings for select using (true);

create policy "listings_seller_insert"
  on public.listings for insert
  with check (auth.uid() = seller_id);

create policy "listings_seller_update"
  on public.listings for update
  using (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);

create policy "listings_seller_delete"
  on public.listings for delete
  using (auth.uid() = seller_id);

-- ============================================================
-- CONVERSATIONS policies
-- ============================================================
create policy "conversations_participant_read"
  on public.conversations for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "conversations_buyer_insert"
  on public.conversations for insert
  with check (auth.uid() = buyer_id);

-- ============================================================
-- MESSAGES policies
-- ============================================================
create policy "messages_participant_read"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

create policy "messages_participant_insert"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

-- ============================================================
-- REVIEWS policies
-- ============================================================
create policy "reviews_public_read"
  on public.reviews for select using (true);

create policy "reviews_buyer_insert"
  on public.reviews for insert
  with check (auth.uid() = reviewer_id);

create policy "reviews_reviewer_update"
  on public.reviews for update
  using (auth.uid() = reviewer_id)
  with check (auth.uid() = reviewer_id);

-- ============================================================
-- Enable Realtime on messages and conversations
-- ============================================================
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;
