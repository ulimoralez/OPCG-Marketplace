import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConversationList } from "@/components/messages/conversation-list";

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirectTo=/messages");

  const { data: conversations } = await supabase
    .from("conversations")
    .select(
      `
      id,
      last_message_at,
      listings!listing_id ( card_name, card_image_url ),
      buyer:profiles!buyer_id ( id, username, avatar_url ),
      seller:profiles!seller_id ( id, username, avatar_url ),
      messages ( body, read_at, sender_id, created_at )
    `
    )
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order("last_message_at", { ascending: false });

  const formattedConversations = (conversations ?? []).map((conv) => {
    const listing = conv.listings as {
      card_name: string;
      card_image_url: string;
    };
    const buyer = conv.buyer as {
      id: string;
      username: string;
      avatar_url: string | null;
    };
    const seller = conv.seller as {
      id: string;
      username: string;
      avatar_url: string | null;
    };
    const otherParty = buyer.id === user.id ? seller : buyer;
    const msgs = (
      conv.messages as {
        body: string;
        read_at: string | null;
        sender_id: string;
        created_at: string;
      }[]
    );
    const sorted = [...msgs].sort((a, b) =>
      b.created_at.localeCompare(a.created_at)
    );
    const lastMsg = sorted[0];
    const unreadCount = msgs.filter(
      (m) => m.read_at === null && m.sender_id !== user.id
    ).length;

    return {
      id: conv.id,
      listingCardName: listing?.card_name ?? "Carta",
      otherPartyUsername: otherParty.username,
      otherPartyAvatarUrl: otherParty.avatar_url,
      lastMessageBody: lastMsg?.body ?? null,
      lastMessageAt: conv.last_message_at,
      unreadCount,
    };
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Mensajes</h1>
      <div className="border rounded-lg overflow-hidden">
        <ConversationList conversations={formattedConversations} />
      </div>
    </div>
  );
}
