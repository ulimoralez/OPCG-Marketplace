import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { MessageSquare } from "lucide-react";
import { ContactSellerButton } from "@/components/listings/contact-seller-button";
import { ListingGallery } from "@/components/listings/listing-gallery";

const CONDITION_LABELS: Record<string, string> = {
  NM: "Near Mint",
  LP: "Lightly Played",
  MP: "Moderately Played",
  HP: "Heavily Played",
  DMG: "Damaged",
};

const COLOR_CLASSES: Record<string, string> = {
  Red: "bg-red-100 text-red-800",
  Blue: "bg-blue-100 text-blue-800",
  Green: "bg-green-100 text-green-800",
  Purple: "bg-purple-100 text-purple-800",
  Black: "bg-gray-200 text-gray-800",
  Yellow: "bg-yellow-100 text-yellow-800",
};

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: listing } = await supabase
    .from("listings")
    .select(`*, profiles!seller_id ( id, username, avatar_url, bio )`)
    .eq("id", id)
    .eq("status", "active")
    .single();

  if (!listing) notFound();

  const seller = listing.profiles as {
    id: string;
    username: string;
    avatar_url: string | null;
    bio: string | null;
  };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwnListing = user?.id === seller.id;

  const colors = (listing.color as string[]) ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-[300px_1fr] gap-8">
        <div className="flex flex-col items-center gap-4">
          <ListingGallery
            photos={(listing.photos as string[]) ?? []}
            cardImageUrl={listing.card_image_url}
            cardName={listing.card_name}
          />
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{listing.card_id}</p>
            <h1 className="text-2xl font-bold">{listing.card_name}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              {listing.set_code && (
                <Badge variant="outline">{listing.set_code}</Badge>
              )}
              {listing.card_type && (
                <Badge variant="outline">{listing.card_type}</Badge>
              )}
              {listing.rarity && (
                <Badge variant="outline">{listing.rarity}</Badge>
              )}
              {colors.map((c: string) => (
                <Badge key={c} className={COLOR_CLASSES[c] ?? ""}>
                  {c}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-primary">
              ${Number(listing.price).toLocaleString("es-AR")}
            </span>
            <Badge variant="secondary">
              {CONDITION_LABELS[listing.condition] ?? listing.condition}
            </Badge>
            <Badge variant="outline">Cantidad: {listing.quantity}</Badge>
          </div>

          {listing.description && (
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm text-muted-foreground">{listing.description}</p>
            </div>
          )}

          {!isOwnListing && user && (
            <ContactSellerButton listingId={id} sellerId={seller.id} />
          )}
          {!user && (
            <Link href={`/login?redirectTo=/listings/${id}`}>
              <Button className="w-full sm:w-auto gap-2">
                <MessageSquare className="h-4 w-4" />
                Inicia sesión para contactar
              </Button>
            </Link>
          )}

          <Separator />

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={seller.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
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
                  {seller.bio && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {seller.bio}
                    </p>
                  )}
                </div>
              </div>
              <Link href={`/profile/${seller.username}`}>
                <Button variant="outline" size="sm" className="w-full">
                  Ver perfil completo
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
