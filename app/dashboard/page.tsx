import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { ListingRowActions } from "@/components/dashboard/listing-row-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

const CONDITION_LABELS: Record<string, string> = {
  NM: "Near Mint",
  LP: "Lightly Played",
  MP: "Moderately Played",
  HP: "Heavily Played",
  DMG: "Damaged",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirectTo=/dashboard");

  const { data: listings } = await supabase
    .from("listings")
    .select("id, card_name, card_image_url, set_code, condition, price, quantity, status, created_at")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  const active = listings?.filter((l) => l.status === "active").length ?? 0;
  const inactive = listings?.filter((l) => l.status === "inactive").length ?? 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mis publicaciones</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {active} activa{active !== 1 ? "s" : ""} · {inactive} pausada{inactive !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild size="sm" className="gap-1.5">
          <Link href="/listings/new">
            <Plus className="h-4 w-4" />
            Nueva publicación
          </Link>
        </Button>
      </div>

      {!listings || listings.length === 0 ? (
        <div className="text-center py-16 border rounded-lg">
          <p className="text-muted-foreground">Todavía no publicaste ninguna carta.</p>
          <Button asChild className="mt-4" size="sm">
            <Link href="/listings/new">Publicar ahora</Link>
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Carta</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Condición</th>
                <th className="text-right px-4 py-3 font-medium">Precio</th>
                <th className="text-center px-4 py-3 font-medium hidden md:table-cell">Cant.</th>
                <th className="text-center px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {listings.map((listing) => (
                <tr key={listing.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {listing.card_image_url ? (
                        <Image
                          src={listing.card_image_url}
                          alt={listing.card_name}
                          width={32}
                          height={44}
                          className="rounded shrink-0 object-cover"
                        />
                      ) : (
                        <div className="w-8 h-11 bg-muted rounded shrink-0" />
                      )}
                      <div className="min-w-0">
                        <Link
                          href={`/listings/${listing.id}`}
                          className="font-medium hover:underline truncate block max-w-[160px]"
                        >
                          {listing.card_name}
                        </Link>
                        {listing.set_code && (
                          <span className="text-xs text-muted-foreground">
                            {listing.set_code}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                    {CONDITION_LABELS[listing.condition] ?? listing.condition}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    ${Number(listing.price).toLocaleString("es-AR")}
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell text-muted-foreground">
                    {listing.quantity}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      variant={listing.status === "active" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {listing.status === "active" ? "Activa" : "Pausada"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ListingRowActions
                      listingId={listing.id}
                      status={listing.status}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
