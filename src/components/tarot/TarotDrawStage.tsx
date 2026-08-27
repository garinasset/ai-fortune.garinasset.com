"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import TarotCardFlip from "@/components/tarot/TarotCardFlip";
import TarotSpreadDisplay from "@/components/tarot/TarotSpreadDisplay";
import { drawTarotSpread } from "@/lib/tarot";
import {
  playTarotPickSound,
  playTarotRevealSound,
  playTarotShuffleSound,
  type TarotSoundHandle,
} from "@/lib/tarot-sound";
import type { DrawnTarotCard } from "@/lib/tarot/types";

interface TarotDrawStageProps {
  question: string;
  onReadyForAnalysis: (cards: DrawnTarotCard[]) => void;
}

type Stage = "shuffle" | "pick" | "preview";

/** 洗牌 → 选牌（即时亮牌）→ 预览 → 用户确认后 AI 解读 */
export default function TarotDrawStage({ question, onReadyForAnalysis }: TarotDrawStageProps) {
  const spread = useMemo(() => drawTarotSpread(question), [question]);
  const [stage, setStage] = useState<Stage>("shuffle");
  const [pickedIndices, setPickedIndices] = useState<number[]>([]);
  const [pickedCards, setPickedCards] = useState<DrawnTarotCard[]>([]);
  const [pickToast, setPickToast] = useState<string | null>(null);
  const shuffleSoundRef = useRef<TarotSoundHandle | null>(null);

  const deckSlots = useMemo(() => Array.from({ length: 9 }, (_, i) => i), []);

  useEffect(() => {
    if (stage !== "shuffle") return;
    shuffleSoundRef.current = playTarotShuffleSound();
    const t = window.setTimeout(() => {
      shuffleSoundRef.current?.stop();
      shuffleSoundRef.current = null;
      setStage("pick");
    }, 2200);
    return () => {
      window.clearTimeout(t);
      shuffleSoundRef.current?.stop();
    };
  }, [stage]);

  const handlePick = (index: number) => {
    if (stage !== "pick" || pickedIndices.includes(index) || pickedIndices.length >= 3) return;

    playTarotPickSound();
    const cardIndex = pickedIndices.length;
    const drawn = spread.cards[cardIndex];
    const nextIndices = [...pickedIndices, index];
    const nextCards = [...pickedCards, drawn];

    setPickedIndices(nextIndices);
    setPickedCards(nextCards);
    setPickToast("已抽牌");
    window.setTimeout(() => setPickToast(null), 1200);

    if (nextIndices.length === 3) {
      window.setTimeout(() => {
        playTarotRevealSound();
        setStage("preview");
      }, 600);
    }
  };

  return (
    <div className="relative mx-auto max-w-lg">
      <div className="mb-4 text-center">
        <p className="text-xs text-violet-400/70">所问</p>
        <p className="text-sm text-violet-100">{question}</p>
      </div>

      {pickToast && (
        <div className="pointer-events-none absolute left-1/2 top-12 z-30 -translate-x-1/2 animate-tarot-fade-up rounded-full border border-app-gold/50 bg-app-gold/20 px-4 py-1.5 text-xs font-semibold text-app-gold shadow-lg backdrop-blur-sm">
          {pickToast}
        </div>
      )}

      {stage === "shuffle" && (
        <div className="relative flex h-56 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-[#1a0f2e] via-[#0d0818] to-[#0a0612]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(139,92,246,0.15),transparent_65%)]" />
          <div className="relative h-40 w-full">
            {deckSlots.map((i) => (
              <div
                key={i}
                className="absolute left-1/2 top-1/2 animate-tarot-shuffle"
                style={{
                  zIndex: i,
                  animationDelay: `${i * 0.06}s`,
                  transform: `translate(calc(-50% + ${(i - 4) * 5}px), calc(-50% + ${Math.sin(i * 0.9) * 5}px)) rotate(${(i - 4) * 3}deg)`,
                }}
              >
                <TarotCardFlip size="md" />
              </div>
            ))}
          </div>
          <p className="absolute bottom-2 w-full text-center text-xs font-medium text-app-gold animate-pulse">
            正在洗牌，请静心默念你的问题…
          </p>
        </div>
      )}

      {stage === "pick" && (
        <>
          <p className="mb-3 text-center text-xs text-app-gold">
            凭直觉选 3 张牌（{pickedIndices.length}/3）
          </p>

          {/* 已抽牌位 — 即时亮牌 */}
          <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-3">
            {spread.cards.map((drawn, i) => {
              const revealed = i < pickedCards.length;
              return (
                <div key={drawn.position} className="flex flex-col items-center">
                  <p className="mb-1.5 text-[10px] font-semibold text-app-gold">{drawn.positionLabel}</p>
                  {revealed ? (
                    <>
                      <div className="shrink-0">
                        <TarotCardFlip drawn={pickedCards[i]} revealed size="sm" />
                      </div>
                      <p className="mt-2 min-h-[2rem] w-full px-0.5 text-center text-[9px] font-medium leading-snug text-violet-100">
                        {pickedCards[i].card.name}
                        {pickedCards[i].reversed && <span className="text-violet-400/60"> · 逆位</span>}
                      </p>
                    </>
                  ) : (
                    <div className="flex h-[128px] w-[78px] items-center justify-center rounded-[14px] border border-dashed border-violet-500/30 bg-[#0a0612]/60">
                      <span className="text-[10px] text-violet-400/50">待选</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-3 justify-items-center gap-x-2 gap-y-4 px-1 sm:gap-x-3">
            {deckSlots.map((i) => {
              const isPicked = pickedIndices.includes(i);
              return (
                <div
                  key={i}
                  className={`transition-all duration-500 ${isPicked ? "scale-90 opacity-30" : ""}`}
                >
                  <TarotCardFlip
                    size="md"
                    selectable={!isPicked}
                    onSelect={() => handlePick(i)}
                    className={isPicked ? "pointer-events-none" : ""}
                  />
                </div>
              );
            })}
          </div>
        </>
      )}

      {stage === "preview" && (
        <div className="animate-tarot-fade-up">
          <p className="mb-4 text-center text-sm font-semibold tracking-wide text-app-gold">你的牌阵</p>
          <TarotSpreadDisplay cards={pickedCards} spreadName={spread.spreadName} size="md" dark />
          <button
            type="button"
            onClick={() => onReadyForAnalysis(pickedCards)}
            className="app-btn mt-6 flex w-full items-center justify-center gap-2 shadow-[0_4px_24px_rgba(139,92,246,0.3)]"
          >
            <Sparkles className="h-4 w-4" />
            AI解读牌阵
          </button>
        </div>
      )}
    </div>
  );
}
