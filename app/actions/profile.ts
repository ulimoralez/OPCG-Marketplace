"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface UpdateProfileInput {
  username: string;
  city: string;
  country: string;
  ships: boolean;
  shippingNotes: string;
  paymentMethods: string[];
}

export async function updateProfile(input: UpdateProfileInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autorizado." };

  const username = input.username.trim();

  if (!username || username.length < 3) {
    return { error: "El nombre de usuario debe tener al menos 3 caracteres." };
  }

  if (!/^[a-zA-Z0-9_.]+$/.test(username)) {
    return {
      error: "El nombre de usuario solo puede tener letras, números, guiones bajos y puntos.",
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      city: input.city.trim() || null,
      country: input.country.trim() || null,
      ships: input.ships,
      shipping_notes: input.shippingNotes.trim() || null,
      payment_methods: input.paymentMethods.filter(Boolean),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") {
      return { error: "Ese nombre de usuario ya está en uso." };
    }
    return { error: "Error al actualizar el perfil." };
  }

  revalidatePath("/", "layout");
  return { success: true };
}
