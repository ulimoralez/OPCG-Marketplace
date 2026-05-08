import Link from "next/link";
import { Plus, MessageSquare } from "lucide-react";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { SearchBar } from "./search-bar";
import { UserMenu } from "./user-menu";
import { UnreadBadge } from "@/components/messages/unread-badge";
import { Button } from "@/components/ui/button";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  let unreadCount = 0;

  if (user) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    profile = profileData;

    if (profile) {
      const { data: convs } = await supabase
        .from("conversations")
        .select("id")
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);

      if (convs && convs.length > 0) {
        const convIds = convs.map((c) => c.id);
        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .is("read_at", null)
          .neq("sender_id", user.id)
          .in("conversation_id", convIds);
        unreadCount = count ?? 0;
      }
    }
  }

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-primary text-primary-foreground shadow-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-accent font-bold text-xl tracking-tight leading-none">
            OPTCG
          </span>
          <span className="font-semibold text-sm opacity-80 hidden sm:block">
            Marketplace
          </span>
        </Link>

        <Suspense>
          <SearchBar />
        </Suspense>

        <nav className="flex items-center gap-2 shrink-0 ml-auto">
          {user && profile ? (
            <>
              <Link href="/messages" className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-primary-foreground hover:bg-white/10"
                >
                  <MessageSquare className="h-5 w-5" />
                </Button>
                <UnreadBadge userId={user.id} initialCount={unreadCount} />
              </Link>
              <Button
                asChild
                size="sm"
                className="bg-accent text-accent-foreground hover:bg-accent/90 hidden sm:flex"
              >
                <Link href="/listings/new">
                  <Plus className="h-4 w-4 mr-1" />
                  Sell
                </Link>
              </Button>
              <UserMenu profile={profile} />
            </>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-primary-foreground hover:bg-white/10"
              >
                <Link href="/login">Sign in</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Link href="/register">Register</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
