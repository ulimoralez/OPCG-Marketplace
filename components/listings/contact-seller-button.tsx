"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { createOrGetConversation } from "@/app/actions/conversations";

interface ContactSellerButtonProps {
  listingId: string;
  sellerId: string;
}

export function ContactSellerButton({ listingId, sellerId }: ContactSellerButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleContact() {
    startTransition(async () => {
      const result = await createOrGetConversation({ listingId, sellerId });
      if (result.error) {
        setError(result.error);
      } else if (result.conversationId) {
        router.push(`/messages/${result.conversationId}`);
      }
    });
  }

  return (
    <div>
      <Button
        onClick={handleContact}
        disabled={isPending}
        className="w-full sm:w-auto gap-2"
      >
        <MessageSquare className="h-4 w-4" />
        {isPending ? "Abriendo chat..." : "Contactar vendedor"}
      </Button>
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </div>
  );
}
