"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardIdInput } from "@/components/publish/card-id-input";
import { CardPreviewDisplay } from "@/components/publish/card-preview";
import { createListing } from "@/app/actions/listings";
import type { CardPreview } from "@/types/optcg";

export default function PublishPage() {
  const [foundCard, setFoundCard] = useState<CardPreview | null>(null);
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleCardFound = useCallback((card: CardPreview | null) => {
    setFoundCard(card);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!foundCard) {
      setError("Primero busca una carta válida.");
      return;
    }
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError("Ingresa un precio válido mayor a 0.");
      return;
    }
    if (!condition) {
      setError("Selecciona la condición de la carta.");
      return;
    }
    setError("");
    setIsPending(true);
    const result = await createListing({
      card: foundCard,
      price: priceNum,
      condition,
      description: description.trim() || undefined,
    });
    setIsPending(false);
    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Publicar carta</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <CardIdInput onCardFound={handleCardFound} />

        {foundCard && <CardPreviewDisplay card={foundCard} />}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Detalles de la venta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="price">Precio (ARS)</Label>
              <Input
                id="price"
                type="number"
                min="1"
                step="1"
                placeholder="ej: 2500"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="condition">Condición</Label>
              <Select onValueChange={setCondition} required>
                <SelectTrigger id="condition">
                  <SelectValue placeholder="Seleccionar condición" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NM">Near Mint (NM)</SelectItem>
                  <SelectItem value="LP">Lightly Played (LP)</SelectItem>
                  <SelectItem value="MP">Moderately Played (MP)</SelectItem>
                  <SelectItem value="HP">Heavily Played (HP)</SelectItem>
                  <SelectItem value="DMG">Damaged (DMG)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Notas opcionales</Label>
              <Textarea
                id="description"
                placeholder="ej: Tiene una pequeña marca en el borde..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={500}
              />
            </div>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          type="submit"
          className="w-full"
          disabled={isPending || !foundCard}
        >
          {isPending ? "Publicando..." : "Publicar carta"}
        </Button>
      </form>
    </div>
  );
}
