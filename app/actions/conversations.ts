"use server";

import { createClient } from "@/lib/supabase/server";

export async function createOrGetConversation({
  listingId,
  sellerId,
}: {
  listingId: string;
  sellerId: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Debes iniciar sesión." };
  if (user.id === sellerId) return { error: "No puedes contactarte contigo mismo." };

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("listing_id", listingId)
    .eq("buyer_id", user.id)
    .maybeSingle();

  if (existing) return { conversationId: existing.id };

  const { data, error } = await supabase
    .from("conversations")
    .insert({ listing_id: listingId, buyer_id: user.id, seller_id: sellerId })
    .select("id")
    .single();

  if (error) return { error: "No se pudo crear la conversación." };

  return { conversationId: data.id };
}
