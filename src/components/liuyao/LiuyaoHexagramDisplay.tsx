"use client";

import HexagramLines from "@/components/HexagramLines";
import type { YaoLine } from "@/lib/liuyao";

interface LiuyaoHexagramDisplayProps {
  lines: YaoLine[];
  guaName: string;
  guaDesc: string;
  trigramLabel?: string;
  lowerTrigram?: string;
  upperTrigram?: string;
  luck?: string;
  showLuck?: boolean;
}

/** 六爻成卦后的统一卦象展示（加粗爻线 + 大号卦名） */
export default function LiuyaoHexagramDisplay({
  lines,
  guaName,
  guaDesc,
  trigramLabel,
  lowerTrigram,
  upperTrigram,
  luck,
  showLuck = false,
}: LiuyaoHexagramDisplayProps) {
  const isGoodLuck = luck === "大吉" || luck === "吉";

  return (
    <div>
      <p className="mb-1 text-center text-xs font-semibold text-app-gold">卦象</p>

      <div className="relative min-h-[12rem] overflow-visible rounded-xl border border-app-gold/25 bg-stone-950/35 px-3 py-2">
        <HexagramLines lines={lines} compact emphasized />
      </div>

      <div className="mt-4 rounded-xl border-2 border-app-gold/50 bg-gradient-to-b from-app-gold/18 to-app-gold/5 px-5 py-5 text-center shadow-[0_0_28px_rgba(212,165,116,0.18)]">
        <p className="mb-3 text-sm font-semibold tracking-[0.25em] text-app-gold">卦 象</p>
        {(upperTrigram && lowerTrigram) && (
          <p className="mb-2 text-xs text-app-muted">
            上{upperTrigram} · 下{lowerTrigram}
            {trigramLabel ? `（${trigramLabel}）` : ""}
          </p>
        )}
        <p className="text-[1.5rem] font-bold leading-snug text-app-gold sm:text-[1.85rem]">
          {guaName}卦
        </p>
        <p className="mt-2 text-sm leading-relaxed text-app-text/90">
          {guaDesc}
        </p>
        {showLuck && luck && (
          <span className={`mt-3 inline-block rounded-full px-3 py-1 text-xs ${
            isGoodLuck ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
          }`}>
            {luck}
          </span>
        )}
      </div>
    </div>
  );
}
