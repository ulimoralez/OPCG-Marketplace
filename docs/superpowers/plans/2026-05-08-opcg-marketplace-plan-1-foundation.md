# OPCG Marketplace — Plan 1: Foundation + Auth

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Initialize the Next.js project, deploy the full database schema to Supabase, and implement a working auth flow (register, login, logout, protected routes).

**Architecture:** Next.js 15 App Router with Server Components for data fetching. Auth state managed via httpOnly cookies using `@supabase/ssr`. Middleware protects `/publish`, `/messages`, `/settings`. PostgreSQL trigger auto-creates a `profiles` row on signup.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Supabase (`@supabase/ssr`), Playwright (E2E tests)

---

## File Map

```
opcg-marketplace/
├── app/
│   ├── layout.tsx                     # Root layout — wraps everything in <Header>
│   ├── page.tsx                       # Homepage stub (fleshed out in Plan 2)
│   ├── (auth)/
│   │   ├── layout.tsx                # Centered card layout, no nav
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   └── actions/
│       └── auth.ts                   # Server Actions: login, register, logout
├── components/
│   ├── header/
│   │   ├── header.tsx                # Server Component — reads auth state
│   │   ├── search-bar.tsx            # Client Component — search input
│   │   └── user-menu.tsx             # Client Component — avatar dropdown
│   └── ui/                           # shadcn/ui auto-generated components
├── lib/
│   └── supabase/
│       ├── server.ts                 # createServerClient (for Server Components + Actions)
│       └── client.ts                 # createBrowserClient (for Client Components)
├── types/
│   └── database.ts                   # Generated Supabase TypeScript types
├── middleware.ts                      # Auth route protection
├── supabase/
│   └── migrations/
│       ├── 20260508000001_initial_schema.sql
│       └── 20260508000002_rls_policies.sql
├── e2e/
│   ├── auth.spec.ts
│   └── playwright.config.ts
├── .env.local.example
├── next.config.ts
└── tailwind.config.ts
```

---

## Task 1: Initialize Next.js project

**Files:**
- Create: `opcg-marketplace/` (entire project)
- Create: `.gitignore`
- Create: `next.config.ts`

- [ ] **Step 1: Scaffold Next.js project**

Run in `E:\ClaudeCosas\OPCGMarketplaceV2`:
```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias="@/*" \
  --no-git
```
When prompted: use default for all options.

- [ ] **Step 2: Verify scaffold**

```bash
ls
```
Expected output includes: `app/`, `components/`, `lib/`, `public/`, `package.json`, `next.config.ts`, `tailwind.config.ts`

- [ ] **Step 3: Initialize git**

```bash
git init
git add .
git commit -m "chore: initial Next.js 15 project scaffold"
```

- [ ] **Step 4: Add secrets to .gitignore**

Append to `.gitignore`:
```
# Local env
.env.local
.env.*.local

# Supabase
supabase/.branches
supabase/.temp

# Visual companion
.superpowers/
```

```bash
git add .gitignore
git commit -m "chore: update gitignore for env and supabase files"
```

---

## Task 2: Install dependencies and configure design tokens

**Files:**
- Modify: `package.json`
- Create: `components.json`
- Modify: `app/globals.css`
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Install Supabase and testing packages**

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install --save-dev supabase @playwright/test
npx playwright install chromium
```

- [ ] **Step 2: Initialize shadcn/ui**

```bash
npx shadcn@latest init
```
When prompted:
- Which style: **Default**
- Which color: **Slate**
- Use CSS variables: **yes**

- [ ] **Step 3: Install required shadcn/ui components**

```bash
npx shadcn@latest add button input label card avatar dropdown-menu skeleton badge separator
```

- [ ] **Step 4: Configure design tokens — replace `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 225 40% 98%;
    --foreground: 222 56% 18%;
    --card: 0 0% 100%;
    --card-foreground: 222 56% 18%;
    --popover: 0 0% 100%;
    --popover-foreground: 222 56% 18%;
    --primary: 222 56% 18%;
    --primary-foreground: 0 0% 100%;
    --secondary: 220 20% 94%;
    --secondary-foreground: 222 56% 18%;
    --muted: 220 20% 94%;
    --muted-foreground: 220 10% 46%;
    --accent: 47 100% 46%;
    --accent-foreground: 222 56% 18%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 100%;
    --border: 220 20% 88%;
    --input: 220 20% 88%;
    --ring: 222 56% 18%;
    --radius: 0.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: install dependencies and configure navy/gold design tokens"
```

---

## Task 3: Supabase project setup

**Files:**
- Create: `.env.local` (not committed)
- Create: `.env.local.example`
- Create: `supabase/config.toml` (auto-generated)

- [ ] **Step 1: Create Supabase project**

Go to https://supabase.com → New project. Choose a region close to your users. Wait for provisioning (~2 min).

- [ ] **Step 2: Get credentials**

In Supabase dashboard → Settings → API:
- Copy **Project URL** (looks like `https://xxxxxxxxxxxx.supabase.co`)
- Copy **anon/public key** (long JWT string)

- [ ] **Step 3: Create `.env.local`**

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

- [ ] **Step 4: Create `.env.local.example`**

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

- [ ] **Step 5: Initialize and link Supabase CLI**

```bash
npx supabase init
npx supabase link --project-ref YOUR_PROJECT_ID
```
Replace `YOUR_PROJECT_ID` with the string from your project URL (the part before `.supabase.co`).

- [ ] **Step 6: Commit**

```bash
git add supabase/ .env.local.example
git commit -m "chore: initialize Supabase CLI and link project"
```

---

## Task 4: Database schema migration

**Files:**
- Create: `supabase/migrations/20260508000001_initial_schema.sql`

- [ ] **Step 1: Create migration file**

Create `supabase/migrations/20260508000001_initial_schema.sql`:

```sql
-- Profiles: extends auth.users
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  city text,
  country text,
  ships boolean default false not null,
  shipping_notes text,
  payment_methods text[] default '{}' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Auto-create profile row when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Listings: card sale listings
create table public.listings (
  id uuid default gen_random_uuid() primary key,
  seller_id uuid references public.profiles(id) on delete cascade not null,
  card_id text not null,
  card_name text not null,
  card_image_url text not null,
  expansion text not null,
  color text[] default '{}' not null,
  card_type text not null,
  rarity text not null,
  price numeric(10,2) not null check (price > 0),
  condition text not null check (
    condition in ('near_mint','lightly_played','moderately_played','heavily_played','damaged')
  ),
  notes text,
  is_active boolean default true not null,
  search_vector tsvector generated always as (to_tsvector('simple', card_name)) stored,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index listings_search_idx on public.listings using gin(search_vector);
create index listings_expansion_idx on public.listings (expansion) where is_active = true;
create index listings_seller_idx on public.listings (seller_id);

-- Conversations: one per buyer+listing pair
create table public.conversations (
  id uuid default gen_random_uuid() primary key,
  listing_id uuid references public.listings(id) on delete cascade not null,
  buyer_id uuid references public.profiles(id) on delete cascade not null,
  seller_id uuid references public.profiles(id) on delete cascade not null,
  last_message_at timestamptz default now() not null,
  created_at timestamptz default now() not null,
  unique(listing_id, buyer_id),
  check (buyer_id != seller_id)
);

-- Messages: individual chat messages
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null check (char_length(content) > 0),
  is_read boolean default false not null,
  created_at timestamptz default now() not null
);

create index messages_conversation_idx on public.messages (conversation_id, created_at);

-- Update last_message_at on conversations when a new message is inserted
create or replace function public.update_conversation_last_message()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.conversations
  set last_message_at = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger on_message_inserted
  after insert on public.messages
  for each row execute procedure public.update_conversation_last_message();

-- Reviews: one per reviewer+reviewed pair
create table public.reviews (
  id uuid default gen_random_uuid() primary key,
  reviewer_id uuid references public.profiles(id) on delete cascade not null,
  reviewed_id uuid references public.profiles(id) on delete cascade not null,
  rating smallint not null check (rating between 1 and 5),
  content text,
  created_at timestamptz default now() not null,
  unique(reviewer_id, reviewed_id),
  check (reviewer_id != reviewed_id)
);

create index reviews_reviewed_idx on public.reviews (reviewed_id);
```

- [ ] **Step 2: Apply migration**

```bash
npx supabase db push
```
Expected output: `Applying migration 20260508000001_initial_schema.sql...` with no errors.

- [ ] **Step 3: Verify tables in Supabase dashboard**

Go to Supabase dashboard → Table Editor. Confirm these tables exist: `profiles`, `listings`, `conversations`, `messages`, `reviews`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/
git commit -m "feat(db): create initial schema with 5 tables and triggers"
```

---

## Task 5: RLS policies migration

**Files:**
- Create: `supabase/migrations/20260508000002_rls_policies.sql`

- [ ] **Step 1: Create RLS migration file**

```sql
-- Enable RLS on all public tables
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;

-- =====================
-- profiles policies
-- =====================
create policy "profiles_select_public"
  on public.profiles for select
  using (true);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- =====================
-- listings policies
-- =====================
create policy "listings_select_active"
  on public.listings for select
  using (is_active = true or auth.uid() = seller_id);

create policy "listings_insert_own"
  on public.listings for insert
  with check (auth.uid() = seller_id);

create policy "listings_update_own"
  on public.listings for update
  using (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);

create policy "listings_delete_own"
  on public.listings for delete
  using (auth.uid() = seller_id);

-- =====================
-- conversations policies
-- =====================
create policy "conversations_select_participants"
  on public.conversations for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "conversations_insert_buyer"
  on public.conversations for insert
  with check (auth.uid() = buyer_id);

-- =====================
-- messages policies
-- =====================
create policy "messages_select_participants"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

create policy "messages_insert_participants"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

create policy "messages_update_mark_read"
  on public.messages for update
  using (
    auth.uid() != sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

-- =====================
-- reviews policies
-- =====================
create policy "reviews_select_public"
  on public.reviews for select
  using (true);

create policy "reviews_insert_authenticated"
  on public.reviews for insert
  with check (auth.uid() = reviewer_id);

create policy "reviews_update_own"
  on public.reviews for update
  using (auth.uid() = reviewer_id);

create policy "reviews_delete_own"
  on public.reviews for delete
  using (auth.uid() = reviewer_id);
```

- [ ] **Step 2: Apply migration**

```bash
npx supabase db push
```
Expected: `Applying migration 20260508000002_rls_policies.sql...` with no errors.

- [ ] **Step 3: Verify in dashboard**

Go to Authentication → Policies. Confirm each table has the expected policies listed.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/
git commit -m "feat(db): add RLS policies for all tables"
```

---

## Task 6: Supabase TypeScript types + client helpers

**Files:**
- Create: `types/database.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/client.ts`

- [ ] **Step 1: Generate TypeScript types from database**

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts
```
Replace `YOUR_PROJECT_ID` with your Supabase project ID.

Expected: `types/database.ts` now contains TypeScript interfaces for all tables.

- [ ] **Step 2: Create server-side Supabase client**

Create `lib/supabase/server.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Intentionally ignored: called from a Server Component,
            // session refresh is handled by middleware
          }
        },
      },
    }
  )
}
```

- [ ] **Step 3: Create browser-side Supabase client**

Create `lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add types/ lib/
git commit -m "feat: add Supabase TypeScript types and client helpers"
```

---

## Task 7: Auth middleware

**Files:**
- Create: `middleware.ts`
- Create: `e2e/playwright.config.ts`
- Create: `e2e/auth.spec.ts`

- [ ] **Step 1: Create Playwright config**

Create `e2e/playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
})
```

- [ ] **Step 2: Write failing E2E test for middleware**

Create `e2e/auth.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Auth middleware', () => {
  test('redirects /publish to /login when not authenticated', async ({ page }) => {
    await page.goto('/publish')
    await expect(page).toHaveURL(/\/login/)
  })

  test('redirects /messages to /login when not authenticated', async ({ page }) => {
    await page.goto('/messages')
    await expect(page).toHaveURL(/\/login/)
  })

  test('redirects /settings to /login when not authenticated', async ({ page }) => {
    await page.goto('/settings')
    await expect(page).toHaveURL(/\/login/)
  })

  test('allows unauthenticated access to homepage', async ({ page }) => {
    await page.goto('/')
    await expect(page).not.toHaveURL(/\/login/)
  })
})
```

- [ ] **Step 3: Run test to confirm it fails**

```bash
npx playwright test e2e/auth.spec.ts --reporter=list
```
Expected: tests fail (no middleware exists yet, protected routes return 404 or don't redirect).

- [ ] **Step 4: Write middleware**

Create `middleware.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PREFIXES = ['/publish', '/messages', '/settings']

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p))
  const isAuthPage = pathname === '/login' || pathname === '/register'

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (isAuthPage && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

- [ ] **Step 5: Create stub pages for protected routes** (so tests can reach them)

Create `app/(protected)/publish/page.tsx`:
```typescript
export default function PublishPage() {
  return <div>Publish (Plan 2)</div>
}
```

Create `app/(protected)/messages/page.tsx`:
```typescript
export default function MessagesPage() {
  return <div>Messages (Plan 4)</div>
}
```

Create `app/(protected)/settings/page.tsx`:
```typescript
export default function SettingsPage() {
  return <div>Settings (Plan 3)</div>
}
```

- [ ] **Step 6: Run tests — confirm they pass**

```bash
npx playwright test e2e/auth.spec.ts --reporter=list
```
Expected: all 4 tests pass.

- [ ] **Step 7: Commit**

```bash
git add middleware.ts app/ e2e/
git commit -m "feat: add auth middleware protecting /publish, /messages, /settings"
```

---

## Task 8: Root layout + fixed header

**Files:**
- Modify: `app/layout.tsx`
- Create: `components/header/header.tsx`
- Create: `components/header/search-bar.tsx`
- Create: `components/header/user-menu.tsx`

- [ ] **Step 1: Create SearchBar client component**

Create `components/header/search-bar.tsx`:

```typescript
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [value, setValue] = useState(searchParams.get('q') ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(() => {
      router.push(`/search?q=${encodeURIComponent(value.trim())}`)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Buscar carta por nombre o ID (ej: OP09-086)..."
        value={value}
        onChange={e => setValue(e.target.value)}
        className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white focus:text-foreground focus:placeholder:text-muted-foreground"
      />
    </form>
  )
}
```

- [ ] **Step 2: Create UserMenu client component**

Create `components/header/user-menu.tsx`:

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { logout } from '@/app/actions/auth'
import Link from 'next/link'

interface UserMenuProps {
  username: string
  avatarUrl: string | null
}

export function UserMenu({ username, avatarUrl }: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="focus:outline-none">
          <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-white/30 hover:ring-white/70 transition-all">
            <AvatarImage src={avatarUrl ?? undefined} alt={username} />
            <AvatarFallback className="bg-accent text-accent-foreground text-sm font-semibold">
              {username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href={`/profile/${username}`}>Mi perfil</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/messages">Mensajes</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">Configuración</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={() => logout()}
        >
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

- [ ] **Step 3: Create Header server component** (create `app/actions/auth.ts` stub first — full version in Task 9)

Create `app/actions/auth.ts` with logout only for now:

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function logout() {
  const supabase = createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

// login and register are added in Task 9
export async function login(_: unknown, formData: FormData) {
  return { error: 'Not implemented yet' }
}

export async function register(_: unknown, formData: FormData) {
  return { error: 'Not implemented yet' }
}
```

Create `components/header/header.tsx`:

```typescript
import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { SearchBar } from './search-bar'
import { UserMenu } from './user-menu'
import { Button } from '@/components/ui/button'
import { MessageSquare } from 'lucide-react'

export async function Header() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .single()
    profile = data
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#1A2744] shadow-md h-16 flex items-center px-4 gap-4">
      <Link href="/" className="text-white font-bold text-xl whitespace-nowrap flex items-center gap-2 shrink-0">
        <span>⚓</span>
        <span className="hidden sm:inline">OPCG Market</span>
      </Link>

      <div className="flex-1 max-w-xl">
        <Suspense>
          <SearchBar />
        </Suspense>
      </div>

      <nav className="flex items-center gap-2 ml-auto shrink-0">
        {user && profile ? (
          <>
            <Link href="/messages">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <MessageSquare className="h-5 w-5" />
              </Button>
            </Link>
            <UserMenu username={profile.username} avatarUrl={profile.avatar_url} />
          </>
        ) : (
          <Link href="/login">
            <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white text-sm">
              Iniciar sesión
            </Button>
          </Link>
        )}
        <Link href="/publish">
          <Button className="bg-[#E8B400] text-[#1A2744] hover:bg-yellow-400 font-semibold text-sm">
            Publicar carta
          </Button>
        </Link>
      </nav>
    </header>
  )
}
```

- [ ] **Step 4: Update root layout**

Replace `app/layout.tsx`:

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/header/header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'OPCG Market — Marketplace de One Piece TCG',
  description: 'Compra y vende cartas de One Piece TCG entre jugadores.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Header />
        <main className="pt-16 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}
```

- [ ] **Step 5: Update homepage stub**

Replace `app/page.tsx`:

```typescript
export default function HomePage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-muted-foreground">Homepage — Plan 2</p>
    </div>
  )
}
```

- [ ] **Step 6: Install lucide-react**

```bash
npm install lucide-react
```

- [ ] **Step 7: Verify build**

```bash
npm run build
```
Expected: builds without TypeScript or compilation errors.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add fixed header with search bar, user menu, and publish CTA"
```

---

## Task 9: Register page + Server Action

**Files:**
- Create: `app/(auth)/layout.tsx`
- Create: `app/(auth)/register/page.tsx`
- Modify: `app/actions/auth.ts`

- [ ] **Step 1: Add register test to `e2e/auth.spec.ts`**

Append to `e2e/auth.spec.ts`:

```typescript
test.describe('Register flow', () => {
  const testEmail = `test+${Date.now()}@example.com`
  const testPassword = 'TestPass123!'

  test('registers a new user and redirects to homepage', async ({ page }) => {
    await page.goto('/register')
    await page.getByLabel('Email').fill(testEmail)
    await page.getByLabel('Contraseña').fill(testPassword)
    await page.getByRole('button', { name: 'Crear cuenta' }).click()
    await expect(page).toHaveURL('/')
    await expect(page.getByText('Publicar carta')).toBeVisible()
  })

  test('shows error for duplicate email', async ({ page }) => {
    await page.goto('/register')
    await page.getByLabel('Email').fill(testEmail)
    await page.getByLabel('Contraseña').fill(testPassword)
    await page.getByRole('button', { name: 'Crear cuenta' }).click()
    await expect(page.getByRole('alert')).toBeVisible()
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx playwright test e2e/auth.spec.ts --grep "Register" --reporter=list
```
Expected: FAIL — register page doesn't exist yet.

- [ ] **Step 3: Create auth layout**

Create `app/(auth)/layout.tsx`:

```typescript
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-background px-4">
      <div className="w-full max-w-sm">
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Implement register Server Action**

Replace `app/actions/auth.ts`:

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function register(_: unknown, formData: FormData) {
  const supabase = createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email y contraseña son requeridos.' }
  }

  if (password.length < 8) {
    return { error: 'La contraseña debe tener al menos 8 caracteres.' }
  }

  const { error } = await supabase.auth.signUp({ email, password })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function login(_: unknown, formData: FormData) {
  const supabase = createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email y contraseña son requeridos.' }
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Email o contraseña incorrectos.' }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function logout() {
  const supabase = createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
```

- [ ] **Step 5: Build register page**

Create `app/(auth)/register/page.tsx`:

```typescript
'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { register } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const initialState = { error: '' }

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(register, initialState)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear cuenta</CardTitle>
        <CardDescription>
          Únete a OPCG Market para comprar y vender cartas.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          {state?.error && (
            <div role="alert" className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
              {state.error}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="tu@email.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              required
              autoComplete="new-password"
              minLength={8}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Creando cuenta...' : 'Crear cuenta'}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
```

- [ ] **Step 6: Run E2E test**

```bash
npx playwright test e2e/auth.spec.ts --grep "Register" --reporter=list
```
Expected: both register tests pass.

- [ ] **Step 7: Commit**

```bash
git add app/ e2e/
git commit -m "feat(auth): implement register page and Server Action"
```

---

## Task 10: Login page + logout

**Files:**
- Create: `app/(auth)/login/page.tsx`
- (No changes to `app/actions/auth.ts` — login is already implemented)

- [ ] **Step 1: Add login + logout E2E tests**

Append to `e2e/auth.spec.ts`:

```typescript
test.describe('Login and logout flow', () => {
  // Use the account created in the register test (re-use same email pattern won't work across runs)
  // Create a dedicated test account in Supabase dashboard:
  //   Email: e2e@opcgmarket.test  Password: TestPass123!
  // This account must exist before running these tests.
  const TEST_EMAIL = 'e2e@opcgmarket.test'
  const TEST_PASSWORD = 'TestPass123!'

  test('logs in with valid credentials and shows user menu', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill(TEST_EMAIL)
    await page.getByLabel('Contraseña').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: 'Iniciar sesión' }).click()
    await expect(page).toHaveURL('/')
    // Avatar button should appear (user is logged in)
    await expect(page.locator('header button').filter({ has: page.locator('span.relative') })).toBeVisible()
  })

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill(TEST_EMAIL)
    await page.getByLabel('Contraseña').fill('wrongpassword')
    await page.getByRole('button', { name: 'Iniciar sesión' }).click()
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })

  test('logs out and redirects to login', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.getByLabel('Email').fill(TEST_EMAIL)
    await page.getByLabel('Contraseña').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: 'Iniciar sesión' }).click()
    await expect(page).toHaveURL('/')

    // Open user menu and log out
    await page.locator('header button').filter({ has: page.locator('span.relative') }).click()
    await page.getByText('Cerrar sesión').click()
    await expect(page).toHaveURL(/\/login/)
  })
})
```

- [ ] **Step 2: Create the test user in Supabase**

Go to Supabase dashboard → Authentication → Users → Add user:
- Email: `e2e@opcgmarket.test`
- Password: `TestPass123!`

- [ ] **Step 3: Run login tests to confirm they fail**

```bash
npx playwright test e2e/auth.spec.ts --grep "Login" --reporter=list
```
Expected: FAIL — login page doesn't exist yet.

- [ ] **Step 4: Build login page**

Create `app/(auth)/login/page.tsx`:

```typescript
'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { login } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const initialState = { error: '' }

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, initialState)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Iniciar sesión</CardTitle>
        <CardDescription>
          Accede a tu cuenta de OPCG Market.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          {state?.error && (
            <div role="alert" className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
              {state.error}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="tu@email.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Tu contraseña"
              required
              autoComplete="current-password"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="text-primary font-medium hover:underline">
              Registrarse
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
```

- [ ] **Step 5: Run all auth E2E tests**

```bash
npx playwright test e2e/auth.spec.ts --reporter=list
```
Expected: all tests pass (middleware redirect × 3, homepage accessible × 1, register × 2, login × 3 = 9 tests passing).

- [ ] **Step 6: Final build check**

```bash
npm run build
```
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add app/ e2e/
git commit -m "feat(auth): implement login page, complete auth flow"
```

---

## Plan 1 Complete

At this point you have:
- Next.js project with Tailwind CSS and shadcn/ui (navy/gold theme)
- Full Supabase database schema with 5 tables, triggers, and RLS policies
- TypeScript types generated from the database
- Working auth flow: register, login, logout, protected routes
- Fixed header with search bar placeholder and user menu
- 9 passing E2E tests covering the auth flow

**Next:** [Plan 2 — Listings + OPTCG API](./2026-05-08-opcg-marketplace-plan-2-listings.md)
