"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface UnreadBadgeProps {
  userId: string;
  initialCount: number;
}

export function UnreadBadge({ userId, initialCount }: UnreadBadgeProps) {
  const [count, setCount] = useState(initialCount);
  const supabase = createClient();

  async function refreshCount() {
    const { data: convs } = await supabase
      .from("conversations")
      .select("id")
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

    if (!convs || convs.length === 0) {
      setCount(0);
      return;
    }

    const convIds = convs.map((c) => c.id);
    const { count: newCount } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .is("read_at", null)
      .neq("sender_id", userId)
      .in("conversation_id", convIds);

    setCount(newCount ?? 0);
  }

  useEffect(() => {
    const channel = supabase
      .channel(`unread:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => refreshCount()
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        () => refreshCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  if (count === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
      {count > 9 ? "9+" : count}
    </span>
  );
}
