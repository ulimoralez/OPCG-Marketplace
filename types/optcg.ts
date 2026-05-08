export interface OPTCGCard {
  id: string
  name: string
  rarity: string
  category: string
  image_url: string
  colors: string[]
  cost: number | null
  power: number | null
  sets: Array<{
    id: string
    label: string
    card_count: number
    type: string
  }>
}

export interface CardPreview {
  cardId: string
  cardName: string
  cardImageUrl: string
  setCode: string
  setName: string
  colors: string[]
  cardType: string
  rarity: string
}
