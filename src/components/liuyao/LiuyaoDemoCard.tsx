"use client";

import HexagramLines from "@/components/HexagramLines";
import { DEMO_LIUYAO } from "@/lib/demo-data";

/** AI 六爻功能示例卡片（首页 + 详情页共用） */
export default function LiuyaoDemoCard() {
  return (
    <div className="app-card !p-3">
      <p className="mb-2 text-[10px] text-app-muted">所问：{DEMO_LIUYAO.question}</p>

      <div className="mb-3 rounded-lg border border-app-gold/25 bg-stone-950/40 px-2 py-2">
        <HexagramLines lines={DEMO_LIUYAO.lines} compact emphasized />
      </div>

      <div className="mb-2 text-center">
        <p className="text-base font-bold text-app-gold sm:text-lg">
          {DEMO_LIUYAO.guaName}卦
          <span className="mx-1.5 font-normal text-app-gold/60">·</span>
          <span className="text-sm font-medium text-app-text/90">{DEMO_LIUYAO.guaDesc}</span>
        </p>
        <span className="mt-1 inline-block rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs text-red-400">
          {DEMO_LIUYAO.luck}
        </span>
      </div>

      <p className="text-xs leading-relaxed text-app-muted">{DEMO_LIUYAO.analysis}</p>
    </div>
  );
}
