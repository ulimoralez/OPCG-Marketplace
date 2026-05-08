"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const EXPANSIONS = [
  "OP01", "OP02", "OP03", "OP04", "OP05",
  "OP06", "OP07", "OP08", "OP09",
  "ST01", "ST02", "ST03", "ST04", "ST05",
];

const COLORS = ["Red", "Blue", "Green", "Purple", "Black", "Yellow"];

const COLOR_CLASSES: Record<string, string> = {
  Red: "bg-red-100 text-red-800 border-red-200",
  Blue: "bg-blue-100 text-blue-800 border-blue-200",
  Green: "bg-green-100 text-green-800 border-green-200",
  Purple: "bg-purple-100 text-purple-800 border-purple-200",
  Black: "bg-gray-200 text-gray-800 border-gray-300",
  Yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
};

const COLOR_LABELS: Record<string, string> = {
  Red: "Rojo",
  Blue: "Azul",
  Green: "Verde",
  Purple: "Morado",
  Black: "Negro",
  Yellow: "Amarillo",
};

export function FilterPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      params.delete("page");
      router.push(`/search?${params.toString()}`);
    },
    [router, searchParams]
  );

  const selectedSet = searchParams.get("set") ?? "";
  const selectedColor = searchParams.get("color") ?? "";
  const priceMin = searchParams.get("price_min") ?? "";
  const priceMax = searchParams.get("price_max") ?? "";

  const hasActiveFilters = selectedSet || selectedColor || priceMin || priceMax;

  return (
    <aside className="space-y-6">
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full gap-1 text-muted-foreground"
          onClick={() =>
            router.push(
              "/search" +
                (searchParams.get("q") ? `?q=${searchParams.get("q")}` : "")
            )
          }
        >
          <X className="h-3 w-3" />
          Limpiar filtros
        </Button>
      )}

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
          Expansión
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {EXPANSIONS.map((exp) => (
            <button
              key={exp}
              onClick={() =>
                updateParam("set", selectedSet === exp ? null : exp)
              }
              className={`px-2 py-0.5 text-xs font-mono rounded border transition-colors ${
                selectedSet === exp
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border hover:bg-muted"
              }`}
            >
              {exp}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
          Color
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {COLORS.map((color) => (
            <button
              key={color}
              onClick={() =>
                updateParam("color", selectedColor === color ? null : color)
              }
              className={`px-2 py-0.5 text-xs rounded border transition-all ${
                selectedColor === color
                  ? `${COLOR_CLASSES[color]} ring-2 ring-offset-1 ring-primary`
                  : `${COLOR_CLASSES[color]} opacity-70 hover:opacity-100`
              }`}
            >
              {COLOR_LABELS[color]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
          Precio (ARS)
        </Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Mín"
            value={priceMin}
            onChange={(e) => updateParam("price_min", e.target.value)}
            className="h-8 text-sm"
            min="0"
          />
          <span className="text-muted-foreground text-sm shrink-0">—</span>
          <Input
            type="number"
            placeholder="Máx"
            value={priceMax}
            onChange={(e) => updateParam("price_max", e.target.value)}
            className="h-8 text-sm"
            min="0"
          />
        </div>
      </div>
    </aside>
  );
}
