import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProfileHeader } from "@/components/profile/profile-header";
import { StarRating } from "@/components/profile/star-rating";
import { ListingCard } from "@/components/listings/listing-card";
import { ListingGrid } from "@/components/listings/listing-grid";
import { WriteReviewForm } from "@/components/reviews/write-review-form";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) notFound();

  const [{ data: listings }, { data: reviews }, { data: { user: currentUser } }] =
    await Promise.all([
      supabase
        .from("listings")
        .select("id, card_name, card_image_url, set_code, color, price, condition")
        .eq("seller_id", profile.id)
        .eq("status", "active")
        .order("created_at", { ascending: false }),

      supabase
        .from("reviews")
        .select(`id, rating, comment, created_at, profiles!reviewer_id ( username, avatar_url )`)
        .eq("seller_id", profile.id)
        .order("created_at", { ascending: false }),

      supabase.auth.getUser(),
    ]);

  const isOwnProfile = currentUser?.id === profile.id;

  let hasAlreadyReviewed = false;
  if (currentUser && !isOwnProfile) {
    const { count } = await supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("reviewer_id", currentUser.id)
      .eq("seller_id", profile.id);
    hasAlreadyReviewed = (count ?? 0) > 0;
  }

  const averageRating =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

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

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          Cartas publicadas ({listings?.length ?? 0})
        </h2>
        {!listings || listings.length === 0 ? (
          <p className="text-muted-foreground">
            Este usuario no tiene publicaciones activas.
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
                sellerUsername={profile.username}
              />
            ))}
          </ListingGrid>
        )}
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          Reseñas ({reviews?.length ?? 0})
        </h2>
        {!reviews || reviews.length === 0 ? (
          <p className="text-muted-foreground">Aún no tiene reseñas.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => {
              const reviewer = review.profiles as {
                username: string;
                avatar_url: string | null;
              };
              return (
                <div
                  key={review.id}
                  className="flex gap-3 p-4 bg-muted/30 rounded-lg"
                >
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
                    {review.comment && (
                      <p className="text-sm text-muted-foreground">
                        {review.comment}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString("es-AR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {currentUser && !isOwnProfile && !hasAlreadyReviewed && (
          <WriteReviewForm
            sellerId={profile.id}
            sellerUsername={profile.username}
          />
        )}
      </section>
    </div>
  );
}
