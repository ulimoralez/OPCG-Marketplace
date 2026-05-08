# OPCG Marketplace — Plan 3: Search + Profiles + Settings

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the search results page with persistent filters, the public user profile page (with listings + reviews), and the settings page (edit profile + avatar upload).

**Architecture:** Search uses URL search params as the single source of truth — a Server Component reads params, builds a parameterized Supabase query, and renders the results. Filters are a Client Component that updates URL params without page reload. Profile page is SSR. Settings page uses Server Actions for profile updates and Supabase Storage directly for avatar upload.

**Tech Stack:** Next.js 15 App Router, Supabase Storage, `@supabase/ssr`, `useSearchParams` / `useRouter`

**Prerequisite:** Plans 1 and 2 must be complete.

---

## File Map

```
app/
├── search/
│   └── page.tsx                              # Search results (SSR, reads ?q=&expansion=&color=&price_min=&price_max=)
├── profile/
│   └── [username]/
│       └── page.tsx                          # Public profile (SSR)
└── (protected)/
    └── settings/
        └── page.tsx                          # Edit profile + avatar upload
components/
├── search/
│   ├── filter-panel.tsx                      # Client: filter sidebar/sheet
│   └── search-results-header.tsx             # Shows result count + active filters
├── profile/
│   ├── profile-header.tsx                    # Avatar, name, location, ships, payments, rating
│   └── star-rating.tsx                       # 1-5 star display component
└── settings/
    ├── profile-form.tsx                      # Client: edit username, city, country, ships, payments
    └── avatar-upload.tsx                     # Client: avatar image upload to Supabase Storage
app/
└── actions/
    └── profile.ts                            # Server Actions: updateProfile
e2e/
└── search.spec.ts
```

---

## Task 1: Search results page

**Files:**
- Create: `app/search/page.tsx`
- Create: `components/search/search-results-header.tsx`

- [ ] **Step 1: Write failing E2E test**

Create `e2e/search.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Search', () => {
  test('loads search page with filter controls', async ({ page }) => {
    await page.goto('/search')
    await expect(page.getByRole('heading', { name: /resultados/i })).toBeVisible()
    await expect(page.getByText('Expansión')).toBeVisible()
    await expect(page.getByText('Color')).toBeVisible()
  })

  test('search bar navigates to /search with q param', async ({ page }) => {
    await page.goto('/')
    await page.getByPlaceholder(/buscar/i).fill('Luffy')
    await page.getByPlaceholder(/buscar/i).press('Enter')
    await expect(page).toHaveURL(/\/search\?q=Luffy/)
  })

  test('expansion filter updates URL', async ({ page }) => {
    await page.goto('/search')
    await page.getByRole('button', { name: 'OP01' }).first().click()
    await expect(page).toHaveURL(/expansion=OP01/)
  })
})
```

```bash
npx playwright test e2e/search.spec.ts --reporter=list
```
Expected: FAIL — search page doesn't exist.

- [ ] **Step 2: Create search results header**

Create `components/search/search-results-header.tsx`:

```typescript
interface SearchResultsHeaderProps {
  count: number
  query: string
}

export function SearchResultsHeader({ count, query }: SearchResultsHeaderProps) {
  return (
    <div>
      <h1 className="text-xl font-bold">
        {query
          ? `Resultados para "${query}"`
          : 'Todas las publicaciones'}
      </h1>
      <p className="text-sm text-muted-foreground mt-0.5">
        {count} {count === 1 ? 'publicación encontrada' : 'publicaciones encontradas'}
      </p>
    </div>
  )
}
```

- [ ] **Step 3: Create filter panel client component**

Create `components/search/filter-panel.tsx`:

```typescript
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'

const EXPANSIONS = [
  'OP01','OP02','OP03','OP04','OP05',
  'OP06','OP07','OP08','OP09',
  'ST01','ST02','ST03','ST04','ST05',
]

const COLORS = ['Rojo', 'Azul', 'Verde', 'Morado', 'Negro', 'Amarillo']

const COLOR_CLASSES: Record<string, string> = {
  Rojo: 'bg-red-100 text-red-800 border-red-200',
  Azul: 'bg-blue-100 text-blue-800 border-blue-200',
  Verde: 'bg-green-100 text-green-800 border-green-200',
  Morado: 'bg-purple-100 text-purple-800 border-purple-200',
  Negro: 'bg-gray-200 text-gray-800 border-gray-300',
  Amarillo: 'bg-yellow-100 text-yellow-800 border-yellow-200',
}

export function FilterPanel() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateParam = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === null || value === '') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`/search?${params.toString()}`)
  }, [router, searchParams])

  const selectedExpansion = searchParams.get('expansion') ?? ''
  const selectedColor = searchParams.get('color') ?? ''
  const priceMin = searchParams.get('price_min') ?? ''
  const priceMax = searchParams.get('price_max') ?? ''

  const hasActiveFilters = selectedExpansion || selectedColor || priceMin || priceMax

  return (
    <aside className="space-y-6">
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full gap-1 text-muted-foreground"
          onClick={() => router.push('/search' + (searchParams.get('q') ? `?q=${searchParams.get('q')}` : ''))}
        >
          <X className="h-3 w-3" />
          Limpiar filtros
        </Button>
      )}

      {/* Expansion filter */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
          Expansión
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {EXPANSIONS.map(exp => (
            <button
              key={exp}
              onClick={() => updateParam('expansion', selectedExpansion === exp ? null : exp)}
              className={`px-2 py-0.5 text-xs font-mono rounded border transition-colors ${
                selectedExpansion === exp
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border hover:bg-muted'
              }`}
            >
              {exp}
            </button>
          ))}
        </div>
      </div>

      {/* Color filter */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
          Color
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {COLORS.map(color => (
            <button
              key={color}
              onClick={() => updateParam('color', selectedColor === color ? null : color)}
              className={`px-2 py-0.5 text-xs rounded border transition-all ${
                selectedColor === color
                  ? `${COLOR_CLASSES[color]} ring-2 ring-offset-1 ring-primary`
                  : `${COLOR_CLASSES[color]} opacity-70 hover:opacity-100`
              }`}
            >
              {color}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
          Precio (ARS)
        </Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Mín"
            value={priceMin}
            onChange={e => updateParam('price_min', e.target.value)}
            className="h-8 text-sm"
            min="0"
          />
          <span className="text-muted-foreground text-sm shrink-0">—</span>
          <Input
            type="number"
            placeholder="Máx"
            value={priceMax}
            onChange={e => updateParam('price_max', e.target.value)}
            className="h-8 text-sm"
            min="0"
          />
        </div>
      </div>
    </aside>
  )
}
```

- [ ] **Step 4: Implement search results page**

Create `app/search/page.tsx`:

```typescript
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listings/listing-card'
import { ListingGrid, ListingGridSkeleton } from '@/components/listings/listing-grid'
import { SearchResultsHeader } from '@/components/search/search-results-header'
import { FilterPanel } from '@/components/search/filter-panel'

interface SearchPageProps {
  searchParams: {
    q?: string
    expansion?: string
    color?: string
    price_min?: string
    price_max?: string
  }
}

async function SearchResults({ searchParams }: SearchPageProps) {
  const supabase = createClient()

  let query = supabase
    .from('listings')
    .select(`
      id, card_name, card_image_url, expansion, color, price, condition,
      profiles!seller_id ( username )
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(48)

  if (searchParams.q?.trim()) {
    query = query.textSearch('search_vector', searchParams.q.trim(), {
      type: 'websearch',
      config: 'simple',
    })
  }

  if (searchParams.expansion) {
    query = query.eq('expansion', searchParams.expansion)
  }

  if (searchParams.color) {
    query = query.contains('color', [searchParams.color])
  }

  if (searchParams.price_min) {
    query = query.gte('price', parseFloat(searchParams.price_min))
  }

  if (searchParams.price_max) {
    query = query.lte('price', parseFloat(searchParams.price_max))
  }

  const { data: listings } = await query

  return (
    <>
      <SearchResultsHeader
        count={listings?.length ?? 0}
        query={searchParams.q ?? ''}
      />
      {!listings || listings.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">
          No se encontraron publicaciones con estos filtros.
        </p>
      ) : (
        <ListingGrid>
          {listings.map(l => (
            <ListingCard
              key={l.id}
              id={l.id}
              cardName={l.card_name}
              cardImageUrl={l.card_image_url}
              expansion={l.expansion}
              color={l.color as string[]}
              price={Number(l.price)}
              condition={l.condition}
              sellerUsername={(l.profiles as { username: string }).username}
            />
          ))}
        </ListingGrid>
      )}
    </>
  )
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Filters sidebar */}
        <div className="md:w-48 shrink-0">
          <Suspense>
            <FilterPanel />
          </Suspense>
        </div>

        {/* Results */}
        <div className="flex-1 space-y-4">
          <Suspense fallback={<ListingGridSkeleton count={8} />}>
            <SearchResults searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run search tests**

```bash
npx playwright test e2e/search.spec.ts --reporter=list
```
Expected: all 3 tests pass.

- [ ] **Step 6: Commit**

```bash
git add app/search/ components/search/ e2e/search.spec.ts
git commit -m "feat: implement search page with full-text search and filter sidebar"
```

---

## Task 2: Star rating component + profile page

**Files:**
- Create: `components/profile/star-rating.tsx`
- Create: `components/profile/profile-header.tsx`
- Create: `app/profile/[username]/page.tsx`

- [ ] **Step 1: Create star rating component**

Create `components/profile/star-rating.tsx`:

```typescript
import { Star } from 'lucide-react'

interface StarRatingProps {
  rating: number    // 0–5, can be decimal
  max?: number
  size?: 'sm' | 'md'
}

export function StarRating({ rating, max = 5, size = 'md' }: StarRatingProps) {
  const sizeClass = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < Math.floor(rating)
        const partial = !filled && i < rating

        return (
          <Star
            key={i}
            className={`${sizeClass} ${
              filled
                ? 'fill-[#E8B400] text-[#E8B400]'
                : partial
                  ? 'fill-[#E8B400]/40 text-[#E8B400]'
                  : 'fill-muted text-muted-foreground'
            }`}
          />
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Create profile header component**

Create `components/profile/profile-header.tsx`:

```typescript
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { StarRating } from './star-rating'
import { MapPin, Truck, CreditCard } from 'lucide-react'

interface ProfileHeaderProps {
  username: string
  avatarUrl: string | null
  city: string | null
  country: string | null
  ships: boolean
  shippingNotes: string | null
  paymentMethods: string[]
  averageRating: number
  reviewCount: number
}

export function ProfileHeader({
  username, avatarUrl, city, country,
  ships, shippingNotes, paymentMethods,
  averageRating, reviewCount,
}: ProfileHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-6 items-start">
      <Avatar className="h-20 w-20 shrink-0">
        <AvatarImage src={avatarUrl ?? undefined} alt={username} />
        <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
          {username.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="space-y-2 flex-1">
        <div>
          <h1 className="text-2xl font-bold">@{username}</h1>
          {(city || country) && (
            <p className="text-muted-foreground text-sm flex items-center gap-1 mt-0.5">
              <MapPin className="h-3.5 w-3.5" />
              {[city, country].filter(Boolean).join(', ')}
            </p>
          )}
        </div>

        {reviewCount > 0 && (
          <div className="flex items-center gap-2">
            <StarRating rating={averageRating} />
            <span className="text-sm text-muted-foreground">
              {averageRating.toFixed(1)} ({reviewCount} {reviewCount === 1 ? 'reseña' : 'reseñas'})
            </span>
          </div>
        )}

        <div className="flex flex-wrap gap-3 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Truck className="h-4 w-4" />
            <span>
              {ships
                ? `Envía${shippingNotes ? ` — ${shippingNotes}` : ''}`
                : 'Solo retiro en persona'}
            </span>
          </div>

          {paymentMethods.length > 0 && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CreditCard className="h-4 w-4" />
              <span>{paymentMethods.join(', ')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Implement public profile page**

Create `app/profile/[username]/page.tsx`:

```typescript
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileHeader } from '@/components/profile/profile-header'
import { ListingCard } from '@/components/listings/listing-card'
import { ListingGrid } from '@/components/listings/listing-grid'
import { StarRating } from '@/components/profile/star-rating'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'

export default async function ProfilePage({
  params,
}: {
  params: { username: string }
}) {
  const supabase = createClient()

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', params.username)
    .single()

  if (!profile) notFound()

  // Fetch active listings
  const { data: listings } = await supabase
    .from('listings')
    .select('id, card_name, card_image_url, expansion, color, price, condition')
    .eq('seller_id', profile.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  // Fetch reviews with reviewer profile
  const { data: reviews } = await supabase
    .from('reviews')
    .select(`
      id, rating, content, created_at,
      profiles!reviewer_id ( username, avatar_url )
    `)
    .eq('reviewed_id', profile.id)
    .order('created_at', { ascending: false })

  const averageRating = reviews && reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      <ProfileHeader
        username={profile.username}
        avatarUrl={profile.avatar_url}
        city={profile.city}
        country={profile.country}
        ships={profile.ships}
        shippingNotes={profile.shipping_notes}
        paymentMethods={profile.payment_methods}
        averageRating={averageRating}
        reviewCount={reviews?.length ?? 0}
      />

      <Separator />

      {/* Active listings */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          Cartas publicadas ({listings?.length ?? 0})
        </h2>
        {!listings || listings.length === 0 ? (
          <p className="text-muted-foreground">Este usuario no tiene publicaciones activas.</p>
        ) : (
          <ListingGrid>
            {listings.map(l => (
              <ListingCard
                key={l.id}
                id={l.id}
                cardName={l.card_name}
                cardImageUrl={l.card_image_url}
                expansion={l.expansion}
                color={l.color as string[]}
                price={Number(l.price)}
                condition={l.condition}
                sellerUsername={profile.username}
              />
            ))}
          </ListingGrid>
        )}
      </section>

      <Separator />

      {/* Reviews */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          Reseñas ({reviews?.length ?? 0})
        </h2>
        {!reviews || reviews.length === 0 ? (
          <p className="text-muted-foreground">Aún no tiene reseñas.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map(review => {
              const reviewer = review.profiles as { username: string; avatar_url: string | null }
              return (
                <div key={review.id} className="flex gap-3 p-4 bg-muted/30 rounded-lg">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={reviewer.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      {reviewer.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/profile/${reviewer.username}`}
                        className="text-sm font-semibold hover:underline"
                      >
                        @{reviewer.username}
                      </Link>
                      <StarRating rating={review.rating} size="sm" />
                    </div>
                    {review.content && (
                      <p className="text-sm text-muted-foreground">{review.content}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString('es-AR', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add app/profile/ components/profile/
git commit -m "feat: implement public profile page with listings and reviews"
```

---

## Task 3: Settings page (edit profile + avatar upload)

**Files:**
- Create: `app/actions/profile.ts`
- Create: `components/settings/profile-form.tsx`
- Create: `components/settings/avatar-upload.tsx`
- Replace: `app/(protected)/settings/page.tsx`

- [ ] **Step 1: Create profile Server Action**

Create `app/actions/profile.ts`:

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface UpdateProfileInput {
  username: string
  city: string
  country: string
  ships: boolean
  shippingNotes: string
  paymentMethods: string[]
}

export async function updateProfile(input: UpdateProfileInput) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado.' }

  const username = input.username.trim()

  if (!username || username.length < 3) {
    return { error: 'El nombre de usuario debe tener al menos 3 caracteres.' }
  }

  if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
    return { error: 'El nombre de usuario solo puede tener letras, números, guiones y puntos.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      username,
      city: input.city.trim() || null,
      country: input.country.trim() || null,
      ships: input.ships,
      shipping_notes: input.shippingNotes.trim() || null,
      payment_methods: input.paymentMethods.filter(Boolean),
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    if (error.code === '23505') {
      return { error: 'Ese nombre de usuario ya está en uso.' }
    }
    return { error: 'Error al actualizar el perfil.' }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}
```

- [ ] **Step 2: Create avatar upload component**

Create `components/settings/avatar-upload.tsx`:

```typescript
'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface AvatarUploadProps {
  userId: string
  username: string
  currentAvatarUrl: string | null
  onUpload: (newUrl: string) => void
}

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024 // 2 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function AvatarUpload({ userId, username, currentAvatarUrl, onUpload }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Solo se aceptan imágenes JPG, PNG o WebP.')
      return
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError('La imagen no puede superar los 2 MB.')
      return
    }

    // Show local preview immediately
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    setIsUploading(true)
    try {
      const path = `${userId}/avatar.${file.name.split('.').pop()}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })

      if (uploadError) {
        setError('Error al subir la imagen.')
        setPreviewUrl(null)
        return
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(path)

      // Update profile avatar_url
      await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl + `?v=${Date.now()}` })
        .eq('id', userId)

      onUpload(data.publicUrl)
    } finally {
      setIsUploading(false)
      URL.revokeObjectURL(objectUrl)
    }
  }

  const displayUrl = previewUrl ?? currentAvatarUrl

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-16 w-16">
        <AvatarImage src={displayUrl ?? undefined} alt={username} />
        <AvatarFallback className="text-xl font-bold bg-primary text-primary-foreground">
          {username.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="space-y-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Subiendo...</>
          ) : (
            <><Upload className="h-4 w-4" /> Cambiar foto</>
          )}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleFileChange}
          className="hidden"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <p className="text-xs text-muted-foreground">JPG, PNG o WebP. Máx 2 MB.</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create profile form component**

Create `components/settings/profile-form.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { updateProfile } from '@/app/actions/profile'

const PAYMENT_OPTIONS = ['Efectivo', 'Transferencia bancaria', 'MercadoPago', 'Uala', 'PayPal']

interface ProfileFormProps {
  initialValues: {
    username: string
    city: string
    country: string
    ships: boolean
    shippingNotes: string
    paymentMethods: string[]
  }
}

export function ProfileForm({ initialValues }: ProfileFormProps) {
  const [values, setValues] = useState(initialValues)
  const [isPending, setIsPending] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  function togglePayment(method: string) {
    setValues(v => ({
      ...v,
      paymentMethods: v.paymentMethods.includes(method)
        ? v.paymentMethods.filter(m => m !== method)
        : [...v.paymentMethods, method],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsPending(true)
    setMessage(null)
    const result = await updateProfile(values)
    setIsPending(false)
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Perfil actualizado correctamente.' })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="username">Nombre de usuario</Label>
        <Input
          id="username"
          value={values.username}
          onChange={e => setValues(v => ({ ...v, username: e.target.value }))}
          placeholder="tu_usuario"
          required
          minLength={3}
          maxLength={30}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="city">Ciudad</Label>
          <Input
            id="city"
            value={values.city}
            onChange={e => setValues(v => ({ ...v, city: e.target.value }))}
            placeholder="Buenos Aires"
            maxLength={100}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="country">País</Label>
          <Input
            id="country"
            value={values.country}
            onChange={e => setValues(v => ({ ...v, country: e.target.value }))}
            placeholder="Argentina"
            maxLength={100}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="ships">Realizo envíos</Label>
          <Switch
            id="ships"
            checked={values.ships}
            onCheckedChange={ships => setValues(v => ({ ...v, ships }))}
          />
        </div>
        {values.ships && (
          <div className="space-y-1.5">
            <Label htmlFor="shippingNotes">Notas de envío</Label>
            <Textarea
              id="shippingNotes"
              value={values.shippingNotes}
              onChange={e => setValues(v => ({ ...v, shippingNotes: e.target.value }))}
              placeholder="ej: Envío por Correo Argentino, OCA, etc."
              rows={2}
              maxLength={200}
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Medios de pago aceptados</Label>
        <div className="flex flex-wrap gap-2">
          {PAYMENT_OPTIONS.map(method => (
            <button
              key={method}
              type="button"
              onClick={() => togglePayment(method)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                values.paymentMethods.includes(method)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border hover:bg-muted'
              }`}
            >
              {method}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <p className={`text-sm ${message.type === 'error' ? 'text-destructive' : 'text-green-600'}`}>
          {message.text}
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Guardando...' : 'Guardar cambios'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 4: Build settings page**

Replace `app/(protected)/settings/page.tsx`:

```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/settings/profile-form'
import { AvatarUpload } from '@/components/settings/avatar-upload'
import { Separator } from '@/components/ui/separator'

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold">Configuración</h1>

      <section className="space-y-4">
        <h2 className="text-base font-semibold">Foto de perfil</h2>
        <AvatarUpload
          userId={user.id}
          username={profile.username}
          currentAvatarUrl={profile.avatar_url}
          onUpload={() => {}}
        />
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-base font-semibold">Información del perfil</h2>
        <ProfileForm
          initialValues={{
            username: profile.username,
            city: profile.city ?? '',
            country: profile.country ?? '',
            ships: profile.ships,
            shippingNotes: profile.shipping_notes ?? '',
            paymentMethods: profile.payment_methods,
          }}
        />
      </section>
    </div>
  )
}
```

- [ ] **Step 5: Install missing shadcn/ui components**

```bash
npx shadcn@latest add switch
```

- [ ] **Step 6: Create Supabase Storage bucket**

In Supabase dashboard → Storage → New bucket:
- Name: `avatars`
- Public: **yes** (so avatar URLs are publicly accessible)

Then in Storage → Policies → `avatars` bucket, add a policy:
- Operation: INSERT, UPDATE, DELETE
- Target: Authenticated users
- Policy: `auth.uid()::text = (storage.foldername(name))[1]`

This restricts each user to only write to their own `{userId}/` folder.

- [ ] **Step 7: Build check**

```bash
npm run build
```
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add app/ components/settings/ app/actions/profile.ts e2e/
git commit -m "feat: implement settings page with profile editing and avatar upload"
```

---

## Plan 3 Complete

At this point you have:
- Search page with full-text search + expansion/color/price filters (URL-driven)
- Public profile page with listings grid, star rating, and reviews list
- Settings page with profile editing and Supabase Storage avatar upload

**Next:** [Plan 4 — Messaging + Reviews + Deploy](./2026-05-08-opcg-marketplace-plan-4-messaging-reviews.md)
