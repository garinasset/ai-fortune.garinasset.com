"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { tossYaoLine, YAO_POSITIONS, resolveHexagram, type CoinTossResult, type YaoLine } from "@/lib/liuyao";
import { playLiuyaoCoinSound, LIUYAO_REVEAL_HOLD_MS, type LiuyaoSoundHandle } from "@/lib/liuyao-coin-sound";
import HexagramLines from "@/components/HexagramLines";
import LiuyaoCastScene from "@/components/liuyao/LiuyaoCastScene";
import LiuyaoHexagramDisplay from "@/components/liuyao/LiuyaoHexagramDisplay";

interface LiuyaoCoinCastProps {
  question: string;
  onRequestAnalysis: (lines: YaoLine[]) => void;
  disabled?: boolean;
}

type CoinSide = 2 | 3;
type CastPhase = "ready" | "shaking" | "flying" | "holding";

const FLY_MS = 720;
const FLY_OUT_MS = 400;

export default function LiuyaoCoinCast({ question, onRequestAnalysis, disabled }: LiuyaoCoinCastProps) {
  const [lines, setLines] = useState<YaoLine[]>([]);
  const [lastToss, setLastToss] = useState<CoinTossResult | null>(null);
  const [castPhase, setCastPhase] = useState<CastPhase>("ready");
  const [incomingLine, setIncomingLine] = useState<YaoLine | null>(null);
  const [incomingIndex, setIncomingIndex] = useState<number | null>(null);
  const [flyActive, setFlyActive] = useState(false);
  const [highlightLineIndex, setHighlightLineIndex] = useState<number | null>(null);
  const [allComplete, setAllComplete] = useState(false);
  const [flyOut, setFlyOut] = useState(false);

  const soundRef = useRef<LiuyaoSoundHandle | null>(null);
  const hexagramRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  const nextIndex = lines.length;
  const canCast = castPhase === "ready" && nextIndex < 6 && !allComplete;

  useEffect(() => () => {
    soundRef.current?.stop();
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  const clearTimers = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const beginFlyIn = useCallback((line: YaoLine, index: number, toss: CoinTossResult) => {
    setFlyOut(false);
    setIncomingLine(line);
    setIncomingIndex(index);
    setLastToss(toss);
    setCastPhase("flying");
    setFlyActive(false);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => setFlyActive(true));
    });

    timerRef.current = window.setTimeout(() => {
      setLines((prev) => [...prev, line]);
      setIncomingLine(null);
      setIncomingIndex(null);
      setFlyActive(false);
      setCastPhase("holding");
      setHighlightLineIndex(index);

      timerRef.current = window.setTimeout(() => {
        setCastPhase("ready");
        setHighlightLineIndex(null);

        if (index >= 5) {
          setAllComplete(true);
          window.setTimeout(() => {
            hexagramRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 100);
        }
      }, LIUYAO_REVEAL_HOLD_MS);
    }, FLY_MS);
  }, []);

  const handleCast = () => {
    if (disabled || !canCast) return;

    clearTimers();
    setCastPhase("shaking");
    setFlyOut(false);
    setHighlightLineIndex(null);
    soundRef.current?.stop();
    soundRef.current = playLiuyaoCoinSound();

    void soundRef.current.done.then(() => {
      setFlyOut(true);

      window.setTimeout(() => {
        const toss = tossYaoLine();
        beginFlyIn(toss.line, lines.length, toss);
      }, FLY_OUT_MS);
    });
  };

  const displaySides: (CoinSide | null)[] = castPhase === "shaking" || flyOut
    ? [null, null, null]
    : lastToss && castPhase !== "flying"
      ? lastToss.coins
      : [2, 2, 2];

  const meta = allComplete ? resolveHexagram(lines) : null;
  const showResultLabel = castPhase === "holding" && lastToss;

  return (
    <div>
      <div className="app-card mb-4">
        <p className="mb-1 text-xs text-app-muted">所问之事</p>
        <p className="text-sm leading-relaxed text-app-text">{question}</p>
      </div>

      <div ref={hexagramRef} className="app-card mb-4 scroll-mt-24 overflow-visible">
        {!allComplete ? (
          <>
            <p className="mb-1 text-center text-xs font-semibold text-app-gold">卦象渐成（自下而上）</p>
            <p className="mb-2 text-center text-[10px] text-app-muted">
              {lines.length === 0 && !incomingLine
                ? "尚未起爻，共需六次"
                : `已得 ${lines.length + (incomingLine ? 1 : 0)} 爻 · 尚需 ${6 - lines.length - (incomingLine ? 1 : 0)} 爻`}
            </p>
            <div className="relative min-h-[12rem] overflow-visible rounded-xl border border-app-gold/25 bg-stone-950/35 px-3 py-2">
              {castPhase === "flying" && flyActive && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 top-0 overflow-hidden">
                  <div className="animate-liuyao-trail absolute left-1/2 bottom-0 h-24 w-1 -translate-x-1/2 bg-gradient-to-t from-app-gold/50 to-transparent" />
                </div>
              )}
              <HexagramLines
                lines={lines}
                compact
                emphasized
                showPlaceholder
                totalLines={6}
                incomingLine={incomingLine}
                incomingLineIndex={incomingIndex}
                flyActive={flyActive}
                highlightLineIndex={highlightLineIndex}
              />
            </div>
            {showResultLabel && (
              <p className="mt-3 text-center text-sm font-semibold animate-liuyao-label-pop text-app-accent">
                ✦ {YAO_POSITIONS[lines.length - 1]} · {lastToss!.line.label}
                {lastToss!.line.isChanging ? " · 动爻" : ""}
              </p>
            )}
          </>
        ) : meta ? (
          <>
            <LiuyaoHexagramDisplay
              lines={lines}
              guaName={meta.guaName}
              guaDesc={meta.guaDesc}
            />
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => onRequestAnalysis(lines)}
                className="app-btn !mb-0 inline-flex min-w-[10rem] items-center justify-center gap-2 px-6 py-3.5"
              >
                卦象解读
              </button>
            </div>
          </>
        ) : null}
      </div>

      {!allComplete && (
        <div className="app-card mb-4 overflow-hidden bg-gradient-to-b from-stone-950/30 via-app-card to-app-bg/80">
          <p className="mb-1 text-center text-sm font-semibold text-app-gold">
            {castPhase === "shaking"
              ? "龟壳摇卦中…"
              : castPhase === "flying"
                ? `第 ${nextIndex + 1} 爻飞入卦象…`
                : castPhase === "holding"
                  ? "观爻象…"
                  : `第 ${nextIndex + 1} / 6 爻`}
          </p>
          <p className="mb-4 text-center text-[11px] text-app-muted">
            {castPhase === "shaking"
              ? "铜钱碰击中…"
              : castPhase === "flying"
                ? "爻象自龟壳飞入卦位"
                : castPhase === "holding"
                  ? "请细观此爻"
                  : !lastToss
                    ? "默念所问，点击「爻挂」"
                    : `请继续掷 ${YAO_POSITIONS[nextIndex]}`}
          </p>

          <button
            type="button"
            onClick={handleCast}
            disabled={disabled || !canCast}
            className="app-btn !mb-0 flex w-full items-center justify-center gap-2 py-4 text-[15px] disabled:opacity-50"
          >
            {castPhase === "shaking"
              ? "摇卦中…"
              : castPhase === "flying" || castPhase === "holding"
                ? "请稍候…"
                : `爻 挂 · ${YAO_POSITIONS[nextIndex]}`}
          </button>

          <div className={`mt-5 ${flyOut ? "animate-liuyao-coin-fly-out" : ""}`}>
            <LiuyaoCastScene sides={displaySides} tossing={castPhase === "shaking"} />
          </div>
        </div>
      )}
    </div>
  );
}
