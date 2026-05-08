import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/settings/profile-form";
import { AvatarUpload } from "@/components/settings/avatar-upload";
import { Separator } from "@/components/ui/separator";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirectTo=/settings");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold">Configuración</h1>

      <section className="space-y-4">
        <h2 className="text-base font-semibold">Foto de perfil</h2>
        <AvatarUpload
          userId={user.id}
          username={profile.username}
          currentAvatarUrl={profile.avatar_url}
          onUpload={() => {}}
        />
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-base font-semibold">Información del perfil</h2>
        <ProfileForm
          initialValues={{
            username: profile.username,
            city: profile.city ?? "",
            country: profile.country ?? "",
            ships: profile.ships,
            shippingNotes: profile.shipping_notes ?? "",
            paymentMethods: profile.payment_methods,
          }}
        />
      </section>
    </div>
  );
}
