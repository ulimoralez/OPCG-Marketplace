"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { CardPreview } from "@/types/optcg";

export interface CreateListingInput {
  card: CardPreview;
  price: number;
  condition: string;
  description?: string;
  photos?: string[];
}

export async function createListing(input: CreateListingInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Debes iniciar sesión para publicar." };
  }

  const validConditions = ["NM", "LP", "MP", "HP", "DMG"];
  if (!validConditions.includes(input.condition)) {
    return { error: "Condición inválida." };
  }

  if (input.price <= 0) {
    return { error: "El precio debe ser mayor a 0." };
  }

  const { data, error } = await supabase
    .from("listings")
    .insert({
      seller_id: user.id,
      card_id: input.card.cardId,
      card_name: input.card.cardName,
      card_image_url: input.card.cardImageUrl,
      set_code: input.card.setCode,
      set_name: input.card.setName,
      color: input.card.colors,
      card_type: input.card.cardType,
      rarity: input.card.rarity,
      price: input.price,
      condition: input.condition,
      description: input.description ?? null,
      photos: input.photos ?? [],
    })
    .select("id")
    .single();

  if (error) {
    return { error: "Error al publicar la carta. Intenta de nuevo." };
  }

  revalidatePath("/");
  redirect(`/listings/${data.id}`);
}

export async function deactivateListing(listingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autorizado." };

  const { error } = await supabase
    .from("listings")
    .update({ status: "inactive" })
    .eq("id", listingId)
    .eq("seller_id", user.id);

  if (error) return { error: "Error al desactivar la publicación." };

  revalidatePath("/dashboard");
  revalidatePath("/");
  return { success: true };
}

export async function reactivateListing(listingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autorizado." };

  const { error } = await supabase
    .from("listings")
    .update({ status: "active" })
    .eq("id", listingId)
    .eq("seller_id", user.id);

  if (error) return { error: "Error al reactivar la publicación." };

  revalidatePath("/dashboard");
  revalidatePath("/");
  return { success: true };
}
