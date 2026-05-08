import { NextResponse } from "next/server";
import type { OPTCGCard, CardPreview } from "@/types/optcg";

const OPTCG_BASE = "https://optcg-api.arjunbansal-ai.workers.dev";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const { cardId } = await params;

  const apiResponse = await fetch(`${OPTCG_BASE}/cards/${cardId}`, {
    headers: { Origin: "https://opbindr.com" },
    next: { revalidate: 86400 },
  });

  if (!apiResponse.ok) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const raw: OPTCGCard = await apiResponse.json();

  const firstSet = raw.sets?.[0];
  const setCode = firstSet ? firstSet.id.replace("-", "") : "";
  const setName = firstSet ? firstSet.label : "";

  const card: CardPreview = {
    cardId: raw.id,
    cardName: raw.name,
    cardImageUrl: raw.image_url,
    setCode,
    setName,
    colors: raw.colors ?? [],
    cardType: raw.category,
    rarity: raw.rarity,
  };

  return NextResponse.json(card);
}
