import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PublishForm } from "./publish-form";

export default async function PublishPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirectTo=/listings/new");

  return <PublishForm userId={user.id} />;
}
