"use client";

import TarotCardIllustration from "@/components/tarot/TarotCardIllustration";
import type { TarotCardMeta } from "@/lib/tarot/types";

interface TarotCardFaceProps {
  card: TarotCardMeta;
  reversed?: boolean;
  size?: "sm" | "md" | "lg";
  glowing?: boolean;
}

const SIZE = {
  sm: { w: "w-[78px]", h: "h-[128px]", pad: "p-[5px]", title: "text-[9px]", sub: "text-[7px]", roman: "text-[8px]" },
  md: { w: "w-[104px]", h: "h-[170px]", pad: "p-[6px]", title: "text-[10px]", sub: "text-[8px]", roman: "text-[9px]" },
  lg: { w: "w-[130px]", h: "h-[212px]", pad: "p-[7px]", title: "text-[11px]", sub: "text-[9px]", roman: "text-[10px]" },
};

/** Tarotap 风格：奶油色牌面 + 双层金框 + 中央插画区 */
export function TarotCardBack({ size = "md", className = "" }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const s = SIZE[size];
  return (
    <div
      className={`tarot-card-back relative overflow-hidden rounded-[14px] shadow-[0_12px_40px_rgba(15,10,30,0.55),0_0_0_1px_rgba(255,215,150,0.15)] ${s.w} ${s.h} ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#1e1035] via-[#2a1850] to-[#0d0818]" />
      <div className="absolute inset-[5px] rounded-[10px] border border-[#d4af6a]/45" />
      <div className="absolute inset-[9px] rounded-[8px] border border-[#d4af6a]/20" />
      <svg viewBox="0 0 100 140" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <pattern id="tarot-back-stars" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="0.6" fill="#d4af6a" opacity="0.35" />
          </pattern>
        </defs>
        <rect width="100" height="140" fill="url(#tarot-back-stars)" opacity="0.5" />
        <circle cx="50" cy="70" r="32" fill="none" stroke="#d4af6a" strokeWidth="0.6" opacity="0.5" />
        <circle cx="50" cy="70" r="22" fill="none" stroke="#d4af6a" strokeWidth="0.4" opacity="0.35" />
        <polygon points="50,42 54,52 50,48 46,52" fill="#d4af6a" opacity="0.6" />
        <polygon points="50,98 54,88 50,92 46,88" fill="#d4af6a" opacity="0.6" />
        <text x="50" y="76" textAnchor="middle" fill="#e8d5a8" fontSize="16" fontFamily="serif">☽ ✦ ☾</text>
      </svg>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(212,175,106,0.14),transparent_60%)]" />
    </div>
  );
}

export default function TarotCardFace({ card, reversed, size = "md", glowing }: TarotCardFaceProps) {
  const s = SIZE[size];

  return (
    <div
      className={`tarot-card-face relative overflow-hidden rounded-[14px] bg-[#f7f2e8] shadow-[0_10px_32px_rgba(30,20,10,0.35),inset_0_0_0_1px_rgba(255,255,255,0.5)] ${s.w} ${s.h} ${
        reversed ? "rotate-180" : ""
      } ${glowing ? "animate-tarot-glow ring-2 ring-amber-400/70" : ""}`}
    >
      {/* 外框 */}
      <div className={`absolute inset-0 ${s.pad}`}>
        <div className="relative h-full w-full rounded-[9px] border-[2.5px] border-[#3d2914] bg-[#faf6ee]">
          <div className="absolute inset-[3px] rounded-[6px] border border-[#c9a227]/70" />

          {/* 罗马数字 / 牌号 */}
          {card.roman && (
            <span className={`absolute left-1.5 top-1 font-serif font-bold text-[#3d2914]/75 ${s.roman}`}>
              {card.roman}
            </span>
          )}
          {card.suit !== "major" && card.number <= 10 && (
            <span className={`absolute right-1.5 top-1 font-serif font-bold text-[#3d2914]/75 ${s.roman}`}>
              {card.number}
            </span>
          )}

          {/* 中央插画 */}
          <div className="absolute inset-x-2 top-5 bottom-8 overflow-hidden rounded-md bg-gradient-to-b from-[#fffdf8] to-[#f0e8d8]">
            <TarotCardIllustration card={card} className="h-full w-full" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(61,41,20,0.08)_100%)]" />
          </div>

          {/* 牌名 */}
          <div className="absolute inset-x-0 bottom-1.5 text-center">
            <p className={`font-serif font-bold leading-tight text-[#2c1810] ${s.title}`}>{card.name}</p>
            <p className={`mt-0.5 font-serif italic leading-none text-[#6b5d4f] ${s.sub}`}>{card.nameEn}</p>
          </div>

          {reversed && (
            <span className="absolute right-1 bottom-[2.2rem] rounded-sm bg-[#3d2914]/85 px-1 py-px text-[7px] font-bold tracking-wide text-[#f7f2e8]">
              R
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
