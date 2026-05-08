import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CONDITION_LABELS: Record<string, string> = {
  NM: "NM",
  LP: "LP",
  MP: "MP",
  HP: "HP",
  DMG: "DMG",
};

const COLOR_CLASSES: Record<string, string> = {
  Red: "bg-red-100 text-red-800",
  Blue: "bg-blue-100 text-blue-800",
  Green: "bg-green-100 text-green-800",
  Purple: "bg-purple-100 text-purple-800",
  Black: "bg-gray-200 text-gray-800",
  Yellow: "bg-yellow-100 text-yellow-800",
};

interface ListingCardProps {
  id: string;
  cardName: string;
  cardImageUrl: string | null;
  setCode: string | null;
  color: string[];
  price: number;
  condition: string;
  sellerUsername: string;
}

export function ListingCard({
  id,
  cardName,
  cardImageUrl,
  setCode,
  color,
  price,
  condition,
  sellerUsername,
}: ListingCardProps) {
  return (
    <Link href={`/listings/${id}`} className="group block">
      <Card className="overflow-hidden transition-all duration-200 group-hover:shadow-lg group-hover:-translate-y-0.5">
        <div className="relative bg-gradient-to-b from-slate-100 to-slate-200 h-[180px] flex items-center justify-center p-2">
          {cardImageUrl ? (
            <Image
              src={cardImageUrl}
              alt={cardName}
              width={120}
              height={168}
              className="object-contain h-full w-auto drop-shadow-md"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-[120px] bg-slate-300 rounded flex items-center justify-center text-slate-500 text-xs">
              No image
            </div>
          )}
        </div>
        <CardContent className="p-3 space-y-1.5">
          <p className="font-semibold text-sm leading-tight line-clamp-2">{cardName}</p>
          <div className="flex flex-wrap gap-1">
            {setCode && (
              <Badge variant="outline" className="text-xs px-1.5 py-0">
                {setCode}
              </Badge>
            )}
            {color.slice(0, 2).map((c) => (
              <Badge
                key={c}
                className={`text-xs px-1.5 py-0 ${COLOR_CLASSES[c] ?? "bg-gray-100 text-gray-800"}`}
              >
                {c}
              </Badge>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-primary">
              ${price.toLocaleString("es-AR")}
            </span>
            <span className="text-xs text-muted-foreground">
              {CONDITION_LABELS[condition] ?? condition}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">@{sellerUsername}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
