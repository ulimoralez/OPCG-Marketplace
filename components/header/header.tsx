import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SearchBar } from "./search-bar";
import { UserMenu } from "./user-menu";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    profile = data;
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
              <Button asChild variant="ghost" size="sm" className="text-primary-foreground hover:bg-white/10">
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
