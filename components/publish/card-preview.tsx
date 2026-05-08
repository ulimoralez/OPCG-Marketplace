import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { CardPreview } from "@/types/optcg";

const COLOR_CLASSES: Record<string, string> = {
  Red: "bg-red-100 text-red-800",
  Blue: "bg-blue-100 text-blue-800",
  Green: "bg-green-100 text-green-800",
  Purple: "bg-purple-100 text-purple-800",
  Black: "bg-gray-200 text-gray-800",
  Yellow: "bg-yellow-100 text-yellow-800",
};

export function CardPreviewDisplay({ card }: { card: CardPreview }) {
  return (
    <Card className="border-green-200 bg-green-50/50">
      <CardContent className="p-4 flex gap-4 items-start">
        <Image
          src={card.cardImageUrl}
          alt={card.cardName}
          width={80}
          height={112}
          className="rounded shadow-sm shrink-0"
        />
        <div className="space-y-1.5 min-w-0">
          <p className="font-semibold text-sm">{card.cardName}</p>
          <p className="text-xs text-muted-foreground">{card.cardId}</p>
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-xs">{card.setCode}</Badge>
            <Badge variant="outline" className="text-xs">{card.cardType}</Badge>
            <Badge variant="outline" className="text-xs">{card.rarity}</Badge>
          </div>
          <div className="flex flex-wrap gap-1">
            {card.colors.map((c) => (
              <Badge key={c} className={`text-xs ${COLOR_CLASSES[c] ?? "bg-gray-100 text-gray-800"}`}>
                {c}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
