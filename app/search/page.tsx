import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { ListingCard } from "@/components/listings/listing-card";
import { ListingGrid, ListingGridSkeleton } from "@/components/listings/listing-grid";
import { SearchResultsHeader } from "@/components/search/search-results-header";
import { FilterPanel } from "@/components/search/filter-panel";

interface SearchParams {
  q?: string;
  set?: string;
  color?: string;
  price_min?: string;
  price_max?: string;
}

async function SearchResults({ params }: { params: SearchParams }) {
  const supabase = await createClient();

  let query = supabase
    .from("listings")
    .select(`id, card_name, card_image_url, set_code, color, price, condition, profiles!seller_id ( username )`)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(48);

  if (params.q?.trim()) {
    query = query.textSearch("search_vector", params.q.trim(), {
      type: "websearch",
      config: "simple",
    });
  }

  if (params.set) {
    query = query.eq("set_code", params.set);
  }

  if (params.color) {
    query = query.contains("color", [params.color]);
  }

  if (params.price_min) {
    query = query.gte("price", parseFloat(params.price_min));
  }

  if (params.price_max) {
    query = query.lte("price", parseFloat(params.price_max));
  }

  const { data: listings } = await query;

  return (
    <>
      <SearchResultsHeader count={listings?.length ?? 0} query={params.q ?? ""} />
      {!listings || listings.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">
          No se encontraron publicaciones con estos filtros.
        </p>
      ) : (
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
      )}
    </>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-52 shrink-0">
          <Suspense>
            <FilterPanel />
          </Suspense>
        </div>

        <div className="flex-1 space-y-4">
          <Suspense fallback={<ListingGridSkeleton count={8} />}>
            <SearchResults params={params} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
