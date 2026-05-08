"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createReview({
  sellerId,
  rating,
  comment,
}: {
  sellerId: string;
  rating: number;
  comment: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Debes iniciar sesión para dejar una reseña." };
  if (user.id === sellerId) return { error: "No puedes reseñarte a ti mismo." };
  if (rating < 1 || rating > 5)
    return { error: "La calificación debe ser entre 1 y 5." };

  // Eligibility: must have had a conversation with the seller, get listing_id too
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, listing_id")
    .or(
      `and(buyer_id.eq.${user.id},seller_id.eq.${sellerId}),and(buyer_id.eq.${sellerId},seller_id.eq.${user.id})`
    )
    .not("listing_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!conversation) {
    return {
      error:
        "Solo puedes reseñar a usuarios con quienes hayas tenido una conversación.",
    };
  }

  const { error } = await supabase.from("reviews").insert({
    reviewer_id: user.id,
    seller_id: sellerId,
    listing_id: conversation.listing_id as string,
    rating,
    comment: comment.trim() || null,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya dejaste una reseña para este vendedor." };
    }
    return { error: "No se pudo guardar la reseña." };
  }

  revalidatePath(`/profile`);
  return { success: true };
}
