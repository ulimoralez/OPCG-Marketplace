"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import type { CardPreview } from "@/types/optcg";

interface CardIdInputProps {
  onCardFound: (card: CardPreview | null) => void;
}

export function CardIdInput({ onCardFound }: CardIdInputProps) {
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "found" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = value.trim().toUpperCase();
    const validFormat = /^[A-Z]{2,3}\d{2}-\d{3}[A-Z]?$/.test(trimmed);

    if (!trimmed) {
      setStatus("idle");
      onCardFound(null);
      return;
    }

    if (!validFormat) {
      setStatus("error");
      setErrorMsg("Formato inválido. Ejemplo: OP09-086");
      onCardFound(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setStatus("loading");
      try {
        const res = await fetch(`/api/cards/${trimmed}`);
        if (!res.ok) {
          setStatus("error");
          setErrorMsg(`Carta "${trimmed}" no encontrada.`);
          onCardFound(null);
          return;
        }
        const card: CardPreview = await res.json();
        setStatus("found");
        setErrorMsg("");
        onCardFound(card);
      } catch {
        setStatus("error");
        setErrorMsg("Error de conexión. Intenta de nuevo.");
        onCardFound(null);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, onCardFound]);

  return (
    <div className="space-y-1.5">
      <Label htmlFor="cardId">ID de carta</Label>
      <div className="relative">
        <Input
          id="cardId"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="ej: OP01-001"
          className={
            status === "error"
              ? "border-destructive"
              : status === "found"
                ? "border-green-500"
                : ""
          }
        />
        {status === "loading" && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
      {status === "error" && (
        <p className="text-xs text-destructive">{errorMsg}</p>
      )}
      {status === "found" && (
        <p className="text-xs text-green-600">Carta encontrada ✓</p>
      )}
    </div>
  );
}
