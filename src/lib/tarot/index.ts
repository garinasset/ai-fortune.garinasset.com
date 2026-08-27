import { TAROT_DECK } from "./deck";
import type { DrawnTarotCard, TarotCardMeta, TarotReadingResult, TarotSpreadDefinition, TarotSpreadId } from "./types";

export * from "./types";
export * from "./deck";

export const TAROT_SPREADS: Record<TarotSpreadId, TarotSpreadDefinition> = {
  three: {
    id: "three",
    name: "三牌阵 · 过去 / 现在 / 未来",
    positions: [
      { id: "past", label: "过去" },
      { id: "present", label: "现在" },
      { id: "future", label: "未来" },
    ],
  },
};

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function drawTarotSpread(question: string, spreadId: TarotSpreadId = "three"): Omit<TarotReadingResult, "analysis" | "advice" | "theme"> {
  const spread = TAROT_SPREADS[spreadId];
  const shuffled = shuffle(TAROT_DECK);
  const picked = shuffled.slice(0, spread.positions.length);

  const cards: DrawnTarotCard[] = picked.map((card, i) => ({
    card,
    reversed: Math.random() < 0.32,
    position: spread.positions[i].id,
    positionLabel: spread.positions[i].label,
  }));

  return {
    question,
    spreadId,
    spreadName: spread.name,
    cards,
  };
}

export function formatCardForAI(drawn: DrawnTarotCard): string {
  const orient = drawn.reversed ? "逆位" : "正位";
  return `${drawn.positionLabel}：${drawn.card.name}（${drawn.card.nameEn}）${orient} · ${drawn.card.keywords}`;
}

export function formatSpreadForAI(result: Pick<TarotReadingResult, "question" | "spreadName" | "cards">): string {
  return [
    `问题：${result.question}`,
    `牌阵：${result.spreadName}`,
    ...result.cards.map(formatCardForAI),
  ].join("\n");
}

export function findTarotCard(id: string): TarotCardMeta | undefined {
  return TAROT_DECK.find((c) => c.id === id);
}
