"use client";

import { useEffect, useState } from "react";
import { MajorArcanaScene } from "@/components/tarot/MajorArcanaArt";
import { getTarotCardImageSrc } from "@/lib/tarot/card-image";
import type { TarotCardMeta, TarotSuit } from "@/lib/tarot/types";

const imageCache = new Map<string, boolean>();

function useTarotImage(cardId: string): boolean | null {
  const cached = imageCache.get(cardId);
  const [hasImage, setHasImage] = useState<boolean | null>(cached ?? null);

  useEffect(() => {
    if (cached !== undefined) {
      setHasImage(cached);
      return;
    }
    const img = new Image();
    img.onload = () => {
      imageCache.set(cardId, true);
      setHasImage(true);
    };
    img.onerror = () => {
      imageCache.set(cardId, false);
      setHasImage(false);
    };
    img.src = getTarotCardImageSrc(cardId);
  }, [cardId, cached]);

  return hasImage;
}

const SUIT_ACCENT: Record<TarotSuit, string> = {
  major: "#6b4c9a",
  wands: "#c2410c",
  cups: "#0369a1",
  swords: "#475569",
  pentacles: "#15803d",
};

const PIP_LAYOUTS: Record<number, [number, number][]> = {
  1: [[60, 72]],
  2: [[60, 50], [60, 94]],
  3: [[60, 42], [60, 72], [60, 102]],
  4: [[42, 52], [78, 52], [42, 92], [78, 92]],
  5: [[42, 48], [78, 48], [60, 72], [42, 96], [78, 96]],
  6: [[42, 48], [78, 48], [42, 72], [78, 72], [42, 96], [78, 96]],
  7: [[60, 42], [42, 62], [78, 62], [42, 82], [78, 82], [42, 102], [78, 102]],
  8: [[42, 46], [78, 46], [42, 66], [78, 66], [42, 86], [78, 86], [42, 106], [78, 106]],
  9: [[42, 44], [60, 44], [78, 44], [42, 72], [60, 72], [78, 72], [42, 100], [60, 100], [78, 100]],
  10: [[36, 44], [52, 44], [68, 44], [84, 44], [36, 72], [52, 72], [68, 72], [84, 72], [44, 100], [76, 100]],
};

function CourtFigure({ accent, symbol, label }: { accent: string; symbol: string; label: string }) {
  return (
    <g>
      <ellipse cx="60" cy="52" rx="14" ry="16" fill={accent} opacity="0.12" />
      <circle cx="60" cy="42" r="9" fill={accent} opacity="0.55" />
      <path d="M48 51 L72 51 L68 95 L52 95 Z" fill={accent} opacity="0.5" />
      <text x="60" y="78" textAnchor="middle" fontSize="18" opacity="0.7">{symbol}</text>
      <text x="60" y="112" textAnchor="middle" fontSize="8" fill={accent} opacity="0.6" fontFamily="serif">{label}</text>
    </g>
  );
}

/** 韦特系风格插画 — 优先加载 public/tarot/{id}.webp，否则 SVG */
export default function TarotCardIllustration({ card, className = "" }: { card: TarotCardMeta; className?: string }) {
  const accent = SUIT_ACCENT[card.suit];
  const imageSrc = getTarotCardImageSrc(card.id);
  const hasImage = useTarotImage(card.id);

  if (hasImage) {
    return (
      <img
        src={imageSrc}
        alt={card.name}
        className={`${className} object-cover object-center`}
      />
    );
  }

  if (hasImage === null) {
    return <div className={`${className} animate-pulse bg-violet-100/40`} />;
  }

  if (card.suit === "major") {
    return (
      <svg viewBox="0 0 120 160" className={className} aria-hidden>
        <defs>
          <radialGradient id={`mg-${card.id}`} cx="50%" cy="42%" r="55%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.28" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.04" />
          </radialGradient>
        </defs>
        <rect x="8" y="8" width="104" height="144" rx="6" fill={`url(#mg-${card.id})`} />
        <MajorArcanaScene number={card.number} accent={accent} />
        <text x="60" y="148" textAnchor="middle" fontSize="14" opacity="0.45">{card.symbol}</text>
      </svg>
    );
  }

  const pipCount = Math.min(card.number, 10);
  const isCourt = card.number >= 11;
  const courtLabels = ["", "", "", "", "", "", "", "", "", "", "Page", "Knight", "Queen", "King"];

  return (
    <svg viewBox="0 0 120 160" className={className} aria-hidden>
      <defs>
        <linearGradient id={`sg-${card.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.16" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.03" />
        </linearGradient>
      </defs>
      <rect x="8" y="8" width="104" height="144" rx="6" fill={`url(#sg-${card.id})`} />
      {!isCourt && pipCount > 0 && (
        <g opacity="0.65">
          {(PIP_LAYOUTS[pipCount] ?? []).map(([x, y], i) => (
            <text key={i} x={x} y={y} textAnchor="middle" fontSize={pipCount <= 3 ? "18" : "13"} fill={accent}>
              {card.symbol}
            </text>
          ))}
        </g>
      )}
      {isCourt && (
        <CourtFigure accent={accent} symbol={card.symbol} label={courtLabels[card.number] ?? ""} />
      )}
      <text x="60" y="148" textAnchor="middle" fontSize="9" fill={accent} opacity="0.55" fontFamily="serif">
        {card.suit === "wands" ? "WANDS" : card.suit === "cups" ? "CUPS" : card.suit === "swords" ? "SWORDS" : "PENTACLES"}
      </text>
    </svg>
  );
}
