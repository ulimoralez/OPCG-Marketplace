import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ListingCard } from "@/components/listings/listing-card";
import { ListingGrid, ListingGridSkeleton } from "@/components/listings/listing-grid";
import { ExpansionGrid } from "@/components/home/expansion-grid";
import { Button } from "@/components/ui/button";
import { Search, TrendingUp, Shield, Zap } from "lucide-react";

async function RecentListings() {
  const supabase = await createClient();

  const { data: listings } = await supabase
    .from("listings")
    .select(`id, card_name, card_image_url, set_code, color, price, condition, profiles!seller_id ( username )`)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(12);

  if (!listings || listings.length === 0) {
    return (
      <div className="text-center py-16 border rounded-xl bg-muted/20">
        <p className="text-muted-foreground font-medium">
          Aún no hay publicaciones.
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          ¡Sé el primero en publicar una carta!
        </p>
        <Button asChild className="mt-4" size="sm">
          <Link href="/listings/new">Publicar ahora</Link>
        </Button>
      </div>
    );
  }

  return (
    <ListingGrid>
      {listings.map((l) => (
        <ListingCard
          key={l.id}
          id={l.id}
          cardName={l.card_name}
          cardImageUrl={l.card_image_url}
          setCode={l.set_code}
          color={(l.color as string[]) ?? []}
          price={Number(l.price)}
          condition={l.condition}
          sellerUsername={(l.profiles as { username: string }).username}
        />
      ))}
    </ListingGrid>
  );
}

export default function HomePage() {
  return (
    <div className="space-y-0">

      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-14 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-2 bg-white/10 text-sm px-3 py-1 rounded-full font-medium">
            <Zap className="h-3.5 w-3.5 text-accent" />
            Marketplace peer-to-peer · Sin comisiones
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
            Comprá y vendé cartas de{" "}
            <span className="text-accent">One Piece TCG</span>
          </h1>
          <p className="text-primary-foreground/70 text-lg max-w-xl mx-auto">
            Conectamos compradores y vendedores de toda la comunidad.
            Encontrá la carta que buscás o publicá las tuyas.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button
              asChild
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold gap-2"
            >
              <Link href="/search">
                <Search className="h-4 w-4" />
                Buscar cartas
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/50 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/listings/new">Publicar carta</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features strip */}
      <section className="border-b bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 py-4 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x">
          {[
            { icon: Shield, text: "Reseñas verificadas entre usuarios" },
            { icon: TrendingUp, text: "Publicaciones de toda la comunidad" },
            { icon: Zap, text: "Chat en tiempo real con el vendedor" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 px-6 py-3 text-sm text-muted-foreground">
              <Icon className="h-4 w-4 text-primary shrink-0" />
              {text}
            </div>
          ))}
        </div>
      </section>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-12">

        {/* Expansiones */}
        <section className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-bold">Explorar por expansión</h2>
            <Link
              href="/search"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Ver todo →
            </Link>
          </div>
          <ExpansionGrid />
        </section>

        {/* Publicaciones recientes */}
        <section className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-bold">Publicaciones recientes</h2>
            <Link
              href="/search"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Ver todas →
            </Link>
          </div>
          <Suspense fallback={<ListingGridSkeleton count={12} />}>
            <RecentListings />
          </Suspense>
        </section>

      </div>
    </div>
  );
}
