"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { createReview } from "@/app/actions/reviews";

interface WriteReviewFormProps {
  sellerId: string;
  sellerUsername: string;
}

export function WriteReviewForm({
  sellerId,
  sellerUsername,
}: WriteReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [result, setResult] = useState<{
    error?: string;
    success?: boolean;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setResult({ error: "Selecciona una calificación." });
      return;
    }
    setIsPending(true);
    const res = await createReview({ sellerId, rating, comment });
    setIsPending(false);
    setResult(res);
  }

  if (result?.success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-700">
        ¡Reseña publicada! Gracias por tu opinión.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded-lg p-4 space-y-4">
      <h3 className="font-semibold text-sm">
        Dejar reseña a @{sellerUsername}
      </h3>

      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                star <= (hovered || rating)
                  ? "fill-accent text-accent"
                  : "fill-muted text-muted-foreground"
              }`}
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="text-sm text-muted-foreground ml-2 self-center">
            {["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"][rating]}
          </span>
        )}
      </div>

      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Comentario opcional..."
        rows={3}
        maxLength={500}
      />

      {result?.error && (
        <p className="text-sm text-destructive">{result.error}</p>
      )}

      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Publicando..." : "Publicar reseña"}
      </Button>
    </form>
  );
}
