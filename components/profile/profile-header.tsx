import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarRating } from "./star-rating";
import { MapPin, Truck, CreditCard } from "lucide-react";

interface ProfileHeaderProps {
  username: string;
  avatarUrl: string | null;
  city: string | null;
  country: string | null;
  ships: boolean;
  shippingNotes: string | null;
  paymentMethods: string[];
  averageRating: number;
  reviewCount: number;
}

export function ProfileHeader({
  username,
  avatarUrl,
  city,
  country,
  ships,
  shippingNotes,
  paymentMethods,
  averageRating,
  reviewCount,
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
              {[city, country].filter(Boolean).join(", ")}
            </p>
          )}
        </div>

        {reviewCount > 0 && (
          <div className="flex items-center gap-2">
            <StarRating rating={averageRating} />
            <span className="text-sm text-muted-foreground">
              {averageRating.toFixed(1)} ({reviewCount}{" "}
              {reviewCount === 1 ? "reseña" : "reseñas"})
            </span>
          </div>
        )}

        <div className="flex flex-wrap gap-3 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Truck className="h-4 w-4" />
            <span>
              {ships
                ? `Envía${shippingNotes ? ` — ${shippingNotes}` : ""}`
                : "Solo retiro en persona"}
            </span>
          </div>

          {paymentMethods.length > 0 && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CreditCard className="h-4 w-4" />
              <span>{paymentMethods.join(", ")}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
