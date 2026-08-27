"use client";

import TarotCardFlip from "@/components/tarot/TarotCardFlip";
import type { DrawnTarotCard } from "@/lib/tarot/types";

interface TarotSpreadDisplayProps {
  cards: DrawnTarotCard[];
  spreadName?: string;
  size?: "sm" | "md" | "lg";
  dark?: boolean;
}

export default function TarotSpreadDisplay({ cards, spreadName, size = "lg", dark }: TarotSpreadDisplayProps) {
  return (
    <div>
      {spreadName && (
        <p className={`mb-4 text-center text-xs font-medium ${dark ? "text-violet-400/70" : "text-app-muted"}`}>
          {spreadName}
        </p>
      )}
      <div className="grid grid-cols-3 gap-3 sm:gap-5">
        {cards.map((drawn, i) => (
          <div
            key={drawn.position}
            className="flex min-h-0 flex-col items-center animate-tarot-fade-up pb-1"
            style={{ animationDelay: `${i * 120}ms` }}
          >
            <p className="mb-2 text-xs font-semibold tracking-wide text-app-gold">{drawn.positionLabel}</p>
            <div className="flex shrink-0 flex-col items-center">
              <TarotCardFlip drawn={drawn} revealed size={size} glowOnReveal={false} />
            </div>
            <p className={`mt-4 w-full px-0.5 text-center text-xs font-semibold leading-snug ${dark ? "text-violet-50" : "text-app-text"}`}>
              {drawn.card.name}
            </p>
            <p className={`mt-0.5 text-center text-[10px] leading-snug ${dark ? "text-violet-400/65" : "text-app-muted"}`}>
              {drawn.reversed ? "逆位" : "正位"} · {drawn.card.keywords.split("·")[0]}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
