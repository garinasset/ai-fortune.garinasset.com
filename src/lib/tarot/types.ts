export type TarotSuit = "major" | "wands" | "cups" | "swords" | "pentacles";

export interface TarotCardMeta {
  id: string;
  name: string;
  nameEn: string;
  suit: TarotSuit;
  /** Major 0–21；小阿卡纳 1–14（11侍从 12骑士 13皇后 14国王） */
  number: number;
  keywords: string;
  symbol: string;
  roman?: string;
}

export interface DrawnTarotCard {
  card: TarotCardMeta;
  reversed: boolean;
  position: string;
  positionLabel: string;
}

export type TarotSpreadId = "three";

export interface TarotSpreadDefinition {
  id: TarotSpreadId;
  name: string;
  positions: { id: string; label: string }[];
}

export interface TarotReadingResult {
  question: string;
  spreadId: TarotSpreadId;
  spreadName: string;
  cards: DrawnTarotCard[];
  analysis: string;
  advice: string;
  theme: string;
}
