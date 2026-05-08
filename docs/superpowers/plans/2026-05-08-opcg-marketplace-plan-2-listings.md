# OPCG Marketplace — Plan 2: Listings + OPTCG API

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the OPTCG API proxy, the "Publish card" form with live card preview, the listing detail page, and the homepage with a recent listings grid.

**Architecture:** The OPTCG API is called server-side via a Next.js Route Handler that caches responses for 24 hours. Card data is denormalized into `listings` at publish time via a Server Action. The homepage and listing detail page are Server Components (SSR). The publish form is a Client Component with real-time card ID validation.

**Tech Stack:** Next.js 15 App Router, Supabase, Zod (form validation), TanStack Query (card preview fetching), `next/image`

**Prerequisite:** Plan 1 must be complete (auth, DB schema, client helpers all working).

---

## File Map

```
app/
├── page.tsx                              # Homepage — recent listings + expansion grid
├── listings/
│   └── [id]/
│       └── page.tsx                      # Individual listing detail (SSR)
├── (protected)/
│   └── publish/
│       └── page.tsx                      # Publish card form (Client Component)
└── api/
    └── cards/
        └── [cardId]/
            └── route.ts                  # OPTCG API proxy (cached 24h)
components/
├── listings/
│   ├── listing-card.tsx                  # Vertical card: image, name, price, seller
│   ├── listing-grid.tsx                  # Responsive grid wrapper
│   └── listing-card-skeleton.tsx         # Skeleton loader for listing cards
├── publish/
│   ├── card-id-input.tsx                 # Card ID field with live preview trigger
│   └── card-preview.tsx                  # Preview of fetched card data
└── home/
    └── expansion-grid.tsx                # Quick-access expansion buttons
app/
└── actions/
    └── listings.ts                       # Server Actions: createListing, deactivateListing
types/
└── optcg.ts                              # Type for OPTCG API response
e2e/
└── listings.spec.ts
```

---

## Task 1: OPTCG API proxy route

**Files:**
- Create: `types/optcg.ts`
- Create: `app/api/cards/[cardId]/route.ts`

- [ ] **Step 1: Research the OPTCG API endpoint**

Before writing code, verify the API base URL by running:

```bash
curl -s "https://optcg-api.dev/cards/OP01-001" | head -c 500
```

If that returns a valid JSON card response, the base URL is confirmed. If not, try `https://api.tcgdex.net/v2/en/sets/OP01/OP01-001` as a fallback. Confirm the response shape and update the types below accordingly.

The expected response shape from `https://optcg-api.dev/cards/{id}`:
```json
{
  "id": "OP01-001",
  "name": "Monkey.D.Luffy",
  "images": { "large": "https://..." },
  "set": { "id": "OP01", "name": "Romance Dawn" },
  "color": "Red",
  "type": "Leader",
  "rarity": "L"
}
```

- [ ] **Step 2: Create OPTCG type**

Create `types/optcg.ts`:

```typescript
export interface OPTCGCard {
  id: string
  name: string
  images: {
    large: string
    small?: string
  }
  set: {
    id: string
    name: string
  }
  color: string | string[]
  type: string
  rarity: string
}

// Normalized shape used in our app
export interface CardPreview {
  cardId: string
  cardName: string
  cardImageUrl: string
  expansion: string
  color: string[]
  cardType: string
  rarity: string
}
```

- [ ] **Step 3: Write failing test for proxy route**

Create `e2e/listings.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

test.describe('OPTCG API proxy', () => {
  test('returns card data for valid card ID', async ({ request }) => {
    const response = await request.get('/api/cards/OP01-001')
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data).toHaveProperty('cardId', 'OP01-001')
    expect(data).toHaveProperty('cardName')
    expect(data).toHaveProperty('cardImageUrl')
    expect(data).toHaveProperty('expansion')
    expect(typeof data.color).toBe('object') // array
  })

  test('returns 404 for invalid card ID', async ({ request }) => {
    const response = await request.get('/api/cards/INVALID-000')
    expect(response.status()).toBe(404)
  })
})
```

```bash
npx playwright test e2e/listings.spec.ts --grep "proxy" --reporter=list
```
Expected: FAIL — route doesn't exist.

- [ ] **Step 4: Implement proxy route**

Create `app/api/cards/[cardId]/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import type { OPTCGCard, CardPreview } from '@/types/optcg'

const OPTCG_BASE = 'https://optcg-api.dev'

function normalizeColor(color: string | string[]): string[] {
  if (Array.isArray(color)) return color
  // API may return comma-separated or slash-separated colors
  return color.split(/[,\/]/).map(c => c.trim()).filter(Boolean)
}

function mapColor(raw: string): string {
  const map: Record<string, string> = {
    Red: 'Rojo', Blue: 'Azul', Green: 'Verde',
    Purple: 'Morado', Black: 'Negro', Yellow: 'Amarillo',
  }
  return map[raw] ?? raw
}

export async function GET(
  _request: Request,
  { params }: { params: { cardId: string } }
) {
  const { cardId } = params

  const apiResponse = await fetch(`${OPTCG_BASE}/cards/${cardId}`, {
    next: { revalidate: 86400 }, // Cache 24 hours
  })

  if (!apiResponse.ok) {
    return NextResponse.json({ error: 'Card not found' }, { status: 404 })
  }

  const raw: OPTCGCard = await apiResponse.json()

  const card: CardPreview = {
    cardId: raw.id,
    cardName: raw.name,
    cardImageUrl: raw.images.large,
    expansion: raw.set.id,
    color: normalizeColor(raw.color).map(mapColor),
    cardType: raw.type,
    rarity: raw.rarity,
  }

  return NextResponse.json(card)
}
```

- [ ] **Step 5: Add OPTCG domain to `next.config.ts`**

Replace `next.config.ts` content:

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'optcg-api.dev',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
}

export default nextConfig
```

- [ ] **Step 6: Run proxy test**

```bash
npx playwright test e2e/listings.spec.ts --grep "proxy" --reporter=list
```
Expected: both proxy tests pass.

- [ ] **Step 7: Commit**

```bash
git add app/api/ types/optcg.ts next.config.ts e2e/
git commit -m "feat: add OPTCG API proxy route with 24h cache"
```

---

## Task 2: Listing card component + skeleton

**Files:**
- Create: `components/listings/listing-card.tsx`
- Create: `components/listings/listing-card-skeleton.tsx`
- Create: `components/listings/listing-grid.tsx`

- [ ] **Step 1: Create listing card component**

Create `components/listings/listing-card.tsx`:

```typescript
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const CONDITION_LABELS: Record<string, string> = {
  near_mint: 'NM',
  lightly_played: 'LP',
  moderately_played: 'MP',
  heavily_played: 'HP',
  damaged: 'DMG',
}

const COLOR_CLASSES: Record<string, string> = {
  Rojo: 'bg-red-100 text-red-800',
  Azul: 'bg-blue-100 text-blue-800',
  Verde: 'bg-green-100 text-green-800',
  Morado: 'bg-purple-100 text-purple-800',
  Negro: 'bg-gray-200 text-gray-800',
  Amarillo: 'bg-yellow-100 text-yellow-800',
}

interface ListingCardProps {
  id: string
  cardName: string
  cardImageUrl: string
  expansion: string
  color: string[]
  price: number
  condition: string
  sellerUsername: string
}

export function ListingCard({
  id,
  cardName,
  cardImageUrl,
  expansion,
  color,
  price,
  condition,
  sellerUsername,
}: ListingCardProps) {
  return (
    <Link href={`/listings/${id}`} className="group block">
      <Card className="overflow-hidden transition-all duration-200 group-hover:shadow-lg group-hover:-translate-y-0.5">
        <div className="relative bg-gradient-to-b from-slate-100 to-slate-200 h-[180px] flex items-center justify-center p-2">
          <Image
            src={cardImageUrl}
            alt={cardName}
            width={120}
            height={168}
            className="object-contain h-full w-auto drop-shadow-md"
            loading="lazy"
          />
        </div>
        <CardContent className="p-3 space-y-1.5">
          <p className="font-semibold text-sm leading-tight line-clamp-2">{cardName}</p>
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-xs px-1.5 py-0">{expansion}</Badge>
            {color.slice(0, 2).map(c => (
              <Badge key={c} className={`text-xs px-1.5 py-0 ${COLOR_CLASSES[c] ?? 'bg-gray-100 text-gray-800'}`}>
                {c}
              </Badge>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-primary">
              ${price.toLocaleString('es-AR')}
            </span>
            <span className="text-xs text-muted-foreground">{CONDITION_LABELS[condition] ?? condition}</span>
          </div>
          <p className="text-xs text-muted-foreground">@{sellerUsername}</p>
        </CardContent>
      </Card>
    </Link>
  )
}
```

- [ ] **Step 2: Create skeleton loader**

Create `components/listings/listing-card-skeleton.tsx`:

```typescript
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export function ListingCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-[180px] w-full rounded-none" />
      <CardContent className="p-3 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex gap-1">
          <Skeleton className="h-5 w-10" />
          <Skeleton className="h-5 w-12" />
        </div>
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 3: Create listing grid wrapper**

Create `components/listings/listing-grid.tsx`:

```typescript
import { ListingCardSkeleton } from './listing-card-skeleton'

interface ListingGridProps {
  children: React.ReactNode
}

export function ListingGrid({ children }: ListingGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
      {children}
    </div>
  )
}

export function ListingGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add components/listings/
git commit -m "feat: add ListingCard component with skeleton loader"
```

---

## Task 3: Listings Server Action (createListing)

**Files:**
- Create: `app/actions/listings.ts`

- [ ] **Step 1: Create listings Server Actions**

Create `app/actions/listings.ts`:

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { CardPreview } from '@/types/optcg'

export interface CreateListingInput {
  card: CardPreview
  price: number
  condition: string
  notes?: string
}

export async function createListing(input: CreateListingInput) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Debes iniciar sesión para publicar.' }
  }

  if (input.price <= 0) {
    return { error: 'El precio debe ser mayor a 0.' }
  }

  const validConditions = ['near_mint', 'lightly_played', 'moderately_played', 'heavily_played', 'damaged']
  if (!validConditions.includes(input.condition)) {
    return { error: 'Condición inválida.' }
  }

  const { data, error } = await supabase
    .from('listings')
    .insert({
      seller_id: user.id,
      card_id: input.card.cardId,
      card_name: input.card.cardName,
      card_image_url: input.card.cardImageUrl,
      expansion: input.card.expansion,
      color: input.card.color,
      card_type: input.card.cardType,
      rarity: input.card.rarity,
      price: input.price,
      condition: input.condition,
      notes: input.notes || null,
    })
    .select('id')
    .single()

  if (error) {
    return { error: 'Error al publicar la carta. Intenta de nuevo.' }
  }

  revalidatePath('/')
  redirect(`/listings/${data.id}`)
}

export async function deactivateListing(listingId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado.' }

  const { error } = await supabase
    .from('listings')
    .update({ is_active: false })
    .eq('id', listingId)
    .eq('seller_id', user.id)

  if (error) return { error: 'Error al desactivar la publicación.' }

  revalidatePath('/')
  return { success: true }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/actions/listings.ts
git commit -m "feat: add createListing and deactivateListing Server Actions"
```

---

## Task 4: Publish card form

**Files:**
- Replace: `app/(protected)/publish/page.tsx`
- Create: `components/publish/card-id-input.tsx`
- Create: `components/publish/card-preview.tsx`

- [ ] **Step 1: Create card ID input component with debounced fetch**

Create `components/publish/card-id-input.tsx`:

```typescript
'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import type { CardPreview } from '@/types/optcg'

interface CardIdInputProps {
  onCardFound: (card: CardPreview | null) => void
}

export function CardIdInput({ onCardFound }: CardIdInputProps) {
  const [value, setValue] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'found' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const trimmed = value.trim().toUpperCase()

    // Basic format check: e.g. OP01-001, ST01-002
    const validFormat = /^[A-Z]{2,3}\d{2}-\d{3}$/.test(trimmed)

    if (!trimmed) {
      setStatus('idle')
      onCardFound(null)
      return
    }

    if (!validFormat) {
      setStatus('error')
      setErrorMsg('Formato inválido. Ejemplo: OP09-086')
      onCardFound(null)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setStatus('loading')
      try {
        const res = await fetch(`/api/cards/${trimmed}`)
        if (!res.ok) {
          setStatus('error')
          setErrorMsg(`Carta "${trimmed}" no encontrada.`)
          onCardFound(null)
          return
        }
        const card: CardPreview = await res.json()
        setStatus('found')
        setErrorMsg('')
        onCardFound(card)
      } catch {
        setStatus('error')
        setErrorMsg('Error de conexión. Intenta de nuevo.')
        onCardFound(null)
      }
    }, 400)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [value, onCardFound])

  return (
    <div className="space-y-1.5">
      <Label htmlFor="cardId">ID de carta</Label>
      <div className="relative">
        <Input
          id="cardId"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="ej: OP09-086"
          className={
            status === 'error' ? 'border-destructive' :
            status === 'found' ? 'border-green-500' : ''
          }
        />
        {status === 'loading' && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
      {status === 'error' && (
        <p className="text-xs text-destructive">{errorMsg}</p>
      )}
      {status === 'found' && (
        <p className="text-xs text-green-600">Carta encontrada ✓</p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create card preview component**

Create `components/publish/card-preview.tsx`:

```typescript
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { CardPreview } from '@/types/optcg'

const COLOR_CLASSES: Record<string, string> = {
  Rojo: 'bg-red-100 text-red-800',
  Azul: 'bg-blue-100 text-blue-800',
  Verde: 'bg-green-100 text-green-800',
  Morado: 'bg-purple-100 text-purple-800',
  Negro: 'bg-gray-200 text-gray-800',
  Amarillo: 'bg-yellow-100 text-yellow-800',
}

export function CardPreviewDisplay({ card }: { card: CardPreview }) {
  return (
    <Card className="border-green-200 bg-green-50/50">
      <CardContent className="p-4 flex gap-4 items-start">
        <Image
          src={card.cardImageUrl}
          alt={card.cardName}
          width={80}
          height={112}
          className="rounded shadow-sm shrink-0"
        />
        <div className="space-y-1.5 min-w-0">
          <p className="font-semibold text-sm">{card.cardName}</p>
          <p className="text-xs text-muted-foreground">{card.cardId}</p>
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-xs">{card.expansion}</Badge>
            <Badge variant="outline" className="text-xs">{card.cardType}</Badge>
            <Badge variant="outline" className="text-xs">{card.rarity}</Badge>
          </div>
          <div className="flex flex-wrap gap-1">
            {card.color.map(c => (
              <Badge key={c} className={`text-xs ${COLOR_CLASSES[c] ?? 'bg-gray-100 text-gray-800'}`}>
                {c}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 3: Build the publish form page**

Replace `app/(protected)/publish/page.tsx`:

```typescript
'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CardIdInput } from '@/components/publish/card-id-input'
import { CardPreviewDisplay } from '@/components/publish/card-preview'
import { createListing } from '@/app/actions/listings'
import type { CardPreview } from '@/types/optcg'

export default function PublishPage() {
  const [foundCard, setFoundCard] = useState<CardPreview | null>(null)
  const [price, setPrice] = useState('')
  const [condition, setCondition] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [isPending, setIsPending] = useState(false)

  const handleCardFound = useCallback((card: CardPreview | null) => {
    setFoundCard(card)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!foundCard) {
      setError('Primero busca una carta válida.')
      return
    }
    const priceNum = parseFloat(price)
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Ingresa un precio válido mayor a 0.')
      return
    }
    if (!condition) {
      setError('Selecciona la condición de la carta.')
      return
    }
    setError('')
    setIsPending(true)
    const result = await createListing({
      card: foundCard,
      price: priceNum,
      condition,
      notes: notes.trim() || undefined,
    })
    setIsPending(false)
    if (result?.error) {
      setError(result.error)
    }
    // On success, createListing redirects to /listings/[id]
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Publicar carta</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <CardIdInput onCardFound={handleCardFound} />

        {foundCard && <CardPreviewDisplay card={foundCard} />}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Detalles de la venta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="price">Precio (ARS)</Label>
              <Input
                id="price"
                type="number"
                min="1"
                step="1"
                placeholder="ej: 2500"
                value={price}
                onChange={e => setPrice(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="condition">Condición</Label>
              <Select onValueChange={setCondition} required>
                <SelectTrigger id="condition">
                  <SelectValue placeholder="Seleccionar condición" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="near_mint">Near Mint (NM)</SelectItem>
                  <SelectItem value="lightly_played">Lightly Played (LP)</SelectItem>
                  <SelectItem value="moderately_played">Moderately Played (MP)</SelectItem>
                  <SelectItem value="heavily_played">Heavily Played (HP)</SelectItem>
                  <SelectItem value="damaged">Damaged (DMG)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notas opcionales</Label>
              <Textarea
                id="notes"
                placeholder="ej: Tiene una pequeña marca en el borde..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                maxLength={500}
              />
            </div>
          </CardContent>
        </Card>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isPending || !foundCard}
        >
          {isPending ? 'Publicando...' : 'Publicar carta'}
        </Button>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Install missing shadcn/ui components**

```bash
npx shadcn@latest add textarea select
```

- [ ] **Step 5: Commit**

```bash
git add components/publish/ app/\(protected\)/publish/
git commit -m "feat: implement publish card form with live OPTCG API preview"
```

---

## Task 5: Listing detail page

**Files:**
- Replace: `app/listings/[id]/page.tsx`

- [ ] **Step 1: Add listing detail E2E test**

Append to `e2e/listings.spec.ts`:

```typescript
test.describe('Listing detail', () => {
  test('shows 404 page for non-existent listing', async ({ page }) => {
    await page.goto('/listings/00000000-0000-0000-0000-000000000000')
    await expect(page.getByText(/no encontrada|not found/i)).toBeVisible()
  })
})
```

```bash
npx playwright test e2e/listings.spec.ts --grep "detail" --reporter=list
```
Expected: FAIL — page returns 404 or error.

- [ ] **Step 2: Implement listing detail page**

Create `app/listings/[id]/page.tsx`:

```typescript
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { MessageSquare, MapPin, Truck, CreditCard } from 'lucide-react'
import { ContactSellerButton } from '@/components/listings/contact-seller-button'

const CONDITION_LABELS: Record<string, string> = {
  near_mint: 'Near Mint',
  lightly_played: 'Lightly Played',
  moderately_played: 'Moderately Played',
  heavily_played: 'Heavily Played',
  damaged: 'Damaged',
}

const COLOR_CLASSES: Record<string, string> = {
  Rojo: 'bg-red-100 text-red-800',
  Azul: 'bg-blue-100 text-blue-800',
  Verde: 'bg-green-100 text-green-800',
  Morado: 'bg-purple-100 text-purple-800',
  Negro: 'bg-gray-200 text-gray-800',
  Amarillo: 'bg-yellow-100 text-yellow-800',
}

export default async function ListingDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()

  const { data: listing } = await supabase
    .from('listings')
    .select(`
      *,
      profiles!seller_id (
        id,
        username,
        avatar_url,
        city,
        country,
        ships,
        shipping_notes,
        payment_methods
      )
    `)
    .eq('id', params.id)
    .eq('is_active', true)
    .single()

  if (!listing) notFound()

  const seller = listing.profiles as {
    id: string
    username: string
    avatar_url: string | null
    city: string | null
    country: string | null
    ships: boolean
    shipping_notes: string | null
    payment_methods: string[]
  }

  const { data: { user } } = await supabase.auth.getUser()
  const isOwnListing = user?.id === seller.id

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-[320px_1fr] gap-8">
        {/* Card image */}
        <div className="flex flex-col items-center gap-4">
          <div className="bg-gradient-to-b from-slate-100 to-slate-200 rounded-xl p-4 w-full flex justify-center">
            <Image
              src={listing.card_image_url}
              alt={listing.card_name}
              width={240}
              height={336}
              className="drop-shadow-xl"
              priority
            />
          </div>
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{listing.card_id}</p>
            <h1 className="text-2xl font-bold">{listing.card_name}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline">{listing.expansion}</Badge>
              <Badge variant="outline">{listing.card_type}</Badge>
              <Badge variant="outline">{listing.rarity}</Badge>
              {(listing.color as string[]).map((c: string) => (
                <Badge key={c} className={COLOR_CLASSES[c] ?? ''}>
                  {c}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-primary">
              ${listing.price.toLocaleString('es-AR')}
            </span>
            <Badge variant="secondary">
              {CONDITION_LABELS[listing.condition] ?? listing.condition}
            </Badge>
          </div>

          {listing.notes && (
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm text-muted-foreground">{listing.notes}</p>
            </div>
          )}

          {!isOwnListing && user && (
            <ContactSellerButton listingId={params.id} sellerId={seller.id} />
          )}
          {!user && (
            <Link href="/login">
              <Button className="w-full sm:w-auto gap-2">
                <MessageSquare className="h-4 w-4" />
                Inicia sesión para contactar
              </Button>
            </Link>
          )}

          <Separator />

          {/* Seller mini-profile */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={seller.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                    {seller.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Link
                    href={`/profile/${seller.username}`}
                    className="font-semibold hover:underline"
                  >
                    @{seller.username}
                  </Link>
                  {(seller.city || seller.country) && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {[seller.city, seller.country].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>
                    {seller.ships
                      ? `Envía${seller.shipping_notes ? ` — ${seller.shipping_notes}` : ''}`
                      : 'Solo retiro en persona'}
                  </span>
                </div>
                {seller.payment_methods.length > 0 && (
                  <div className="flex items-start gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span>{seller.payment_methods.join(', ')}</span>
                  </div>
                )}
              </div>

              <Link href={`/profile/${seller.username}`}>
                <Button variant="outline" size="sm" className="mt-4 w-full">
                  Ver perfil completo
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create ContactSellerButton client component**

Create `components/listings/contact-seller-button.tsx`:

```typescript
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { MessageSquare } from 'lucide-react'
import { createOrGetConversation } from '@/app/actions/conversations'

interface ContactSellerButtonProps {
  listingId: string
  sellerId: string
}

export function ContactSellerButton({ listingId, sellerId }: ContactSellerButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleContact() {
    startTransition(async () => {
      const result = await createOrGetConversation({ listingId, sellerId })
      if (result.error) {
        setError(result.error)
      } else if (result.conversationId) {
        router.push(`/messages/${result.conversationId}`)
      }
    })
  }

  return (
    <div>
      <Button
        onClick={handleContact}
        disabled={isPending}
        className="w-full sm:w-auto gap-2"
      >
        <MessageSquare className="h-4 w-4" />
        {isPending ? 'Abriendo chat...' : 'Contactar vendedor'}
      </Button>
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 4: Create conversations Server Action stub** (full implementation in Plan 4)

Create `app/actions/conversations.ts`:

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'

export async function createOrGetConversation({
  listingId,
  sellerId,
}: {
  listingId: string
  sellerId: string
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Debes iniciar sesión.' }
  if (user.id === sellerId) return { error: 'No puedes contactarte contigo mismo.' }

  // Check existing
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('listing_id', listingId)
    .eq('buyer_id', user.id)
    .single()

  if (existing) return { conversationId: existing.id }

  // Create new
  const { data, error } = await supabase
    .from('conversations')
    .insert({ listing_id: listingId, buyer_id: user.id, seller_id: sellerId })
    .select('id')
    .single()

  if (error) return { error: 'No se pudo crear la conversación.' }

  return { conversationId: data.id }
}
```

- [ ] **Step 5: Run listing detail tests**

```bash
npx playwright test e2e/listings.spec.ts --reporter=list
```
Expected: proxy tests pass + detail 404 test passes.

- [ ] **Step 6: Commit**

```bash
git add app/listings/ components/listings/ app/actions/
git commit -m "feat: implement listing detail page with seller mini-profile"
```

---

## Task 6: Homepage with recent listings + expansion grid

**Files:**
- Replace: `app/page.tsx`
- Create: `components/home/expansion-grid.tsx`

- [ ] **Step 1: Create expansion grid component**

Create `components/home/expansion-grid.tsx`:

```typescript
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const EXPANSIONS = [
  'OP01', 'OP02', 'OP03', 'OP04', 'OP05',
  'OP06', 'OP07', 'OP08', 'OP09',
  'ST01', 'ST02', 'ST03', 'ST04', 'ST05',
]

export function ExpansionGrid() {
  return (
    <div className="flex flex-wrap gap-2">
      {EXPANSIONS.map(exp => (
        <Link key={exp} href={`/search?expansion=${exp}`}>
          <Button
            variant="outline"
            size="sm"
            className="font-mono text-xs hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            {exp}
          </Button>
        </Link>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Implement homepage**

Replace `app/page.tsx`:

```typescript
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listings/listing-card'
import { ListingGrid, ListingGridSkeleton } from '@/components/listings/listing-grid'
import { ExpansionGrid } from '@/components/home/expansion-grid'

async function RecentListings() {
  const supabase = createClient()

  const { data: listings } = await supabase
    .from('listings')
    .select(`
      id, card_name, card_image_url, expansion, color, price, condition,
      profiles!seller_id ( username )
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(12)

  if (!listings || listings.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-12">
        Aún no hay publicaciones. ¡Sé el primero en publicar!
      </p>
    )
  }

  return (
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
  )
}

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
      {/* Hero */}
      <section className="text-center space-y-2 py-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary">
          Marketplace de One Piece TCG
        </h1>
        <p className="text-muted-foreground text-lg">
          Compra y vende cartas entre jugadores. Sin intermediarios.
        </p>
      </section>

      {/* Expansions quick access */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Buscar por expansión</h2>
        <ExpansionGrid />
      </section>

      {/* Recent listings */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Publicaciones recientes</h2>
        <Suspense fallback={<ListingGridSkeleton count={12} />}>
          <RecentListings />
        </Suspense>
      </section>
    </div>
  )
}
```

- [ ] **Step 3: Add homepage E2E test**

Append to `e2e/listings.spec.ts`:

```typescript
test.describe('Homepage', () => {
  test('loads homepage with expansion grid', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Marketplace de One Piece TCG')).toBeVisible()
    await expect(page.getByText('OP01')).toBeVisible()
    await expect(page.getByText('OP09')).toBeVisible()
  })
})
```

- [ ] **Step 4: Run all listing tests**

```bash
npx playwright test e2e/listings.spec.ts --reporter=list
```
Expected: all 4 tests pass (proxy ×2, detail 404, homepage ×1).

- [ ] **Step 5: Final build check**

```bash
npm run build
```
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx components/home/
git commit -m "feat: implement homepage with recent listings and expansion quick-access"
```

---

## Plan 2 Complete

At this point you have:
- OPTCG API proxy with 24h server-side caching
- Publish card form with debounced live preview
- Listing detail page with seller mini-profile
- Homepage with recent listings grid and expansion quick-access
- `createListing` and `deactivateListing` Server Actions
- Contact seller button that creates/fetches a conversation

**Next:** [Plan 3 — Search + Profiles + Settings](./2026-05-08-opcg-marketplace-plan-3-search-profiles.md)
