import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface ConversationItem {
  id: string;
  listingCardName: string;
  otherPartyUsername: string;
  otherPartyAvatarUrl: string | null;
  lastMessageBody: string | null;
  lastMessageAt: string;
  unreadCount: number;
}

interface ConversationListProps {
  conversations: ConversationItem[];
}

export function ConversationList({ conversations }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No tienes mensajes todavía.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Contacta a un vendedor desde cualquier publicación para iniciar una
          conversación.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {conversations.map((conv) => (
        <Link
          key={conv.id}
          href={`/messages/${conv.id}`}
          className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
        >
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={conv.otherPartyAvatarUrl ?? undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
              {conv.otherPartyUsername.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-sm truncate">
                @{conv.otherPartyUsername}
              </p>
              <span className="text-xs text-muted-foreground shrink-0">
                {new Date(conv.lastMessageAt).toLocaleDateString("es-AR", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {conv.listingCardName}
            </p>
            {conv.lastMessageBody && (
              <p className="text-sm text-muted-foreground truncate mt-0.5">
                {conv.lastMessageBody}
              </p>
            )}
          </div>

          {conv.unreadCount > 0 && (
            <Badge className="shrink-0 bg-accent text-accent-foreground">
              {conv.unreadCount}
            </Badge>
          )}
        </Link>
      ))}
    </div>
  );
}
