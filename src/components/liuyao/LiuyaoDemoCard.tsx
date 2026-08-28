"use client";

import HexagramLines from "@/components/HexagramLines";
import { DEMO_LIUYAO } from "@/lib/demo-data";

const LUCK_STYLE: Record<string, string> = {
  大吉: "text-emerald-400",
  吉: "text-emerald-400",
  平: "text-app-muted",
  凶: "text-rose-400",
  大凶: "text-rose-400",
};

/** AI 六爻功能示例（与生成海报 / 解卦结果页一致的展示） */
export default function LiuyaoDemoCard() {
  const luckClass = LUCK_STYLE[DEMO_LIUYAO.luck] ?? "text-app-muted";

  return (
    <div className="app-card overflow-hidden !p-0">
      <div className="border-b border-app-border/50 px-3 py-2.5">
        <p className="text-xs text-app-muted">所问</p>
        <p className="mt-0.5 text-sm text-app-text">{DEMO_LIUYAO.question}</p>
      </div>

      <div className="px-3 py-3">
        <div className="rounded-xl border border-app-gold/20 bg-stone-950/40 px-2 py-3">
          <HexagramLines lines={DEMO_LIUYAO.lines} compact emphasized />
          <div className="mt-3 text-center">
            {(DEMO_LIUYAO.upperTrigram && DEMO_LIUYAO.lowerTrigram) && (
              <p className="mb-1 text-[10px] text-app-muted">
                上{DEMO_LIUYAO.upperTrigram} · 下{DEMO_LIUYAO.lowerTrigram}
                {DEMO_LIUYAO.trigramLabel ? `（${DEMO_LIUYAO.trigramLabel}）` : ""}
              </p>
            )}
            <p className="text-base font-bold text-app-gold">
              {DEMO_LIUYAO.guaName}卦
              <span className="mx-1.5 font-normal text-app-muted">·</span>
              <span className={`text-sm font-medium ${luckClass}`}>{DEMO_LIUYAO.luck}</span>
            </p>
            <p className="mt-1 text-xs text-app-text/85">{DEMO_LIUYAO.guaDesc}</p>
          </div>
        </div>
      </div>

      <div className="mx-3 mb-3 rounded-xl border border-app-border/40 bg-app-bg/35 px-3 py-2.5">
        <h3 className="mb-2 text-xs font-semibold text-app-gold">AI大模型解卦</h3>
        <p className="text-[11px] leading-relaxed text-app-text/90">{DEMO_LIUYAO.analysis}</p>
        {DEMO_LIUYAO.advice && (
          <p className="mt-2 border-t border-app-border/30 pt-2 text-[11px] leading-relaxed text-app-text/85">
            💡 {DEMO_LIUYAO.advice}
          </p>
        )}
      </div>
    </div>
  );
}
