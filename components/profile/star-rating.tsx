import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: "sm" | "md";
}

export function StarRating({ rating, max = 5, size = "md" }: StarRatingProps) {
  const sizeClass = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < Math.floor(rating);
        const partial = !filled && i < rating;

        return (
          <Star
            key={i}
            className={`${sizeClass} ${
              filled
                ? "fill-[#E8B400] text-[#E8B400]"
                : partial
                  ? "fill-[#E8B400]/40 text-[#E8B400]"
                  : "fill-muted text-muted-foreground"
            }`}
          />
        );
      })}
    </div>
  );
}
