import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { ListingCard } from "@/components/listings/listing-card";
import { ListingGrid, ListingGridSkeleton } from "@/components/listings/listing-grid";
import { ExpansionGrid } from "@/components/home/expansion-grid";

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
      <p className="text-muted-foreground text-center py-12">
        Aún no hay publicaciones. ¡Sé el primero en publicar!
      </p>
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
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
      <section className="text-center space-y-2 py-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary">
          Marketplace de One Piece TCG
        </h1>
        <p className="text-muted-foreground text-lg">
          Compra y vende cartas entre jugadores. Sin intermediarios.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Buscar por expansión</h2>
        <ExpansionGrid />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Publicaciones recientes</h2>
        <Suspense fallback={<ListingGridSkeleton count={12} />}>
          <RecentListings />
        </Suspense>
      </section>
    </div>
  );
}
