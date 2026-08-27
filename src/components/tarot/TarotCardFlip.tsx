"use client";

import { useEffect, useState } from "react";
import TarotCardFace, { TarotCardBack } from "@/components/tarot/TarotCardFace";
import type { DrawnTarotCard } from "@/lib/tarot/types";

interface TarotCardFlipProps {
  drawn?: DrawnTarotCard | null;
  revealed?: boolean;
  size?: "sm" | "md" | "lg";
  delay?: number;
  onRevealComplete?: () => void;
  className?: string;
  selectable?: boolean;
  onSelect?: () => void;
  /** 翻开后是否播放光晕（牌阵展示建议关闭，避免遮挡下方牌名） */
  glowOnReveal?: boolean;
}

export default function TarotCardFlip({
  drawn,
  revealed = false,
  size = "md",
  delay = 0,
  onRevealComplete,
  className = "",
  selectable,
  onSelect,
  glowOnReveal = true,
}: TarotCardFlipProps) {
  const [flipped, setFlipped] = useState(revealed && !!drawn);
  const [landed, setLanded] = useState(false);

  useEffect(() => {
    if (!revealed || !drawn) {
      setFlipped(false);
      return;
    }
    const t1 = window.setTimeout(() => setFlipped(true), delay);
    const t2 = window.setTimeout(() => {
      setLanded(true);
      onRevealComplete?.();
    }, delay + 680);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [revealed, drawn, delay, onRevealComplete]);

  const sizeClass = size === "lg" ? "h-[212px] w-[130px]" : size === "sm" ? "h-[128px] w-[78px]" : "h-[170px] w-[104px]";

  return (
    <button
      type="button"
      disabled={!selectable}
      onClick={selectable ? onSelect : undefined}
      className={`tarot-flip-scene group relative ${sizeClass} ${selectable ? "cursor-pointer" : "cursor-default"} ${className}`}
      style={{ perspective: "900px" }}
    >
      <div
        className={`tarot-flip-inner relative h-full w-full transition-transform duration-700 ease-[cubic-bezier(0.34,1.35,0.64,1)] ${
          flipped ? "[transform:rotateY(180deg)]" : ""
        } ${landed ? "animate-tarot-land" : ""} ${selectable && !flipped ? "animate-tarot-float group-hover:scale-105" : ""}`}
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className="absolute inset-0 [backface-visibility:hidden]">
          <TarotCardBack size={size} className="h-full w-full" />
        </div>
        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          {drawn ? (
            <TarotCardFace card={drawn.card} reversed={drawn.reversed} size={size} glowing={glowOnReveal && landed} />
          ) : (
            <TarotCardBack size={size} className="h-full w-full" />
          )}
        </div>
      </div>
      {selectable && !flipped && (
        <span className="pointer-events-none absolute -bottom-5 left-1/2 w-max -translate-x-1/2 text-[10px] font-medium text-app-gold opacity-0 transition-opacity group-hover:opacity-100">
          选这张
        </span>
      )}
    </button>
  );
}
