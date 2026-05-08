interface MessageBubbleProps {
  body: string;
  isOwn: boolean;
  createdAt: string;
  senderUsername: string;
}

export function MessageBubble({
  body,
  isOwn,
  createdAt,
  senderUsername,
}: MessageBubbleProps) {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
          isOwn
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm"
        }`}
      >
        {!isOwn && (
          <p className="text-xs font-semibold mb-0.5 opacity-70">
            @{senderUsername}
          </p>
        )}
        <p className="text-sm whitespace-pre-wrap break-words">{body}</p>
        <p
          className={`text-xs mt-1 ${
            isOwn ? "opacity-60 text-right" : "opacity-50"
          }`}
        >
          {new Date(createdAt).toLocaleTimeString("es-AR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
