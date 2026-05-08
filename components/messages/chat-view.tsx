"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageBubble } from "./message-bubble";
import { sendMessage, markConversationAsRead } from "@/app/actions/messages";
import { createClient } from "@/lib/supabase/client";
import { Send } from "lucide-react";

interface Message {
  id: string;
  body: string;
  sender_id: string;
  created_at: string;
  profiles: { username: string } | null;
}

interface ChatViewProps {
  conversationId: string;
  currentUserId: string;
  initialMessages: Message[];
}

export function ChatView({
  conversationId,
  currentUserId,
  initialMessages,
}: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    markConversationAsRead(conversationId);
  }, [conversationId]);

  useEffect(() => {
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMsg = payload.new as Omit<Message, "profiles">;
          const { data: profile } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", newMsg.sender_id)
            .single();

          setMessages((prev) => [...prev, { ...newMsg, profiles: profile }]);

          if (newMsg.sender_id !== currentUserId) {
            markConversationAsRead(conversationId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId, supabase]);

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isPending) return;
    setError("");
    startTransition(async () => {
      const result = await sendMessage({ conversationId, body: trimmed });
      if (result?.error) {
        setError(result.error);
      } else {
        setInput("");
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            body={msg.body}
            isOwn={msg.sender_id === currentUserId}
            createdAt={msg.created_at}
            senderUsername={msg.profiles?.username ?? "Usuario"}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t p-3 bg-background">
        {error && <p className="text-xs text-destructive mb-2">{error}</p>}
        <div className="flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje... (Enter para enviar, Shift+Enter para nueva línea)"
            rows={2}
            maxLength={2000}
            className="resize-none"
          />
          <Button
            onClick={handleSend}
            disabled={isPending || !input.trim()}
            size="icon"
            className="shrink-0 h-10 w-10"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
