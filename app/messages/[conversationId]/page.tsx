import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { ChatView } from "@/components/messages/chat-view";
import { ChevronLeft } from "lucide-react";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirectTo=/messages");

  const { data: conversation } = await supabase
    .from("conversations")
    .select(
      `
      id, buyer_id, seller_id,
      listings!listing_id ( id, card_name, card_image_url ),
      buyer:profiles!buyer_id ( id, username ),
      seller:profiles!seller_id ( id, username )
    `
    )
    .eq("id", conversationId)
    .single();

  if (!conversation) notFound();

  const buyer = conversation.buyer as { id: string; username: string };
  const seller = conversation.seller as { id: string; username: string };

  if (buyer.id !== user.id && seller.id !== user.id) notFound();

  const otherParty = buyer.id === user.id ? seller : buyer;
  const listing = conversation.listings as {
    id: string;
    card_name: string;
    card_image_url: string | null;
  };

  const { data: messages } = await supabase
    .from("messages")
    .select(
      `
      id, body, sender_id, created_at,
      profiles!sender_id ( username )
    `
    )
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  const initialMessages = (messages ?? []).map((m) => ({
    id: m.id,
    body: m.body,
    sender_id: m.sender_id,
    created_at: m.created_at,
    profiles: m.profiles as { username: string } | null,
  }));

  return (
    <div className="max-w-2xl mx-auto">
      <div className="border-b px-4 py-3 flex items-center gap-3 sticky top-16 bg-background z-10">
        <Link
          href="/messages"
          className="text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        {listing?.card_image_url && (
          <Image
            src={listing.card_image_url}
            alt={listing.card_name}
            width={32}
            height={44}
            className="rounded shrink-0 object-cover"
          />
        )}
        <div className="flex-1 min-w-0">
          {listing && (
            <Link
              href={`/listings/${listing.id}`}
              className="text-sm font-semibold hover:underline truncate block"
            >
              {listing.card_name}
            </Link>
          )}
          <p className="text-xs text-muted-foreground">
            Con{" "}
            <Link
              href={`/profile/${otherParty.username}`}
              className="hover:underline"
            >
              @{otherParty.username}
            </Link>
          </p>
        </div>
      </div>

      <ChatView
        conversationId={conversationId}
        currentUserId={user.id}
        initialMessages={initialMessages}
      />
    </div>
  );
}
