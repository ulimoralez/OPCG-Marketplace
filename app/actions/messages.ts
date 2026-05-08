"use server";

import { createClient } from "@/lib/supabase/server";

export async function sendMessage({
  conversationId,
  body,
}: {
  conversationId: string;
  body: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autorizado." };

  const trimmed = body.trim();
  if (!trimmed) return { error: "El mensaje no puede estar vacío." };
  if (trimmed.length > 2000)
    return { error: "El mensaje no puede superar los 2000 caracteres." };

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, buyer_id, seller_id")
    .eq("id", conversationId)
    .single();

  if (!conversation) return { error: "Conversación no encontrada." };
  if (
    conversation.buyer_id !== user.id &&
    conversation.seller_id !== user.id
  ) {
    return { error: "No tienes acceso a esta conversación." };
  }

  const { error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: user.id, body: trimmed });

  if (error) return { error: "No se pudo enviar el mensaje." };

  return { success: true };
}

export async function markConversationAsRead(conversationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", user.id)
    .is("read_at", null);
}
