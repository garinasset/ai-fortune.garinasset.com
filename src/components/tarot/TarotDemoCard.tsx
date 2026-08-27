"use client";

import TarotSpreadDisplay from "@/components/tarot/TarotSpreadDisplay";
import { DEMO_TAROT } from "@/lib/demo-data";

/** 塔罗 AI 功能示例 */
export default function TarotDemoCard({ dark = true }: { dark?: boolean }) {
  return (
    <div
      className={
        dark
          ? "rounded-xl border border-violet-500/20 bg-[#14101f]/80 p-3"
          : "app-card !p-3"
      }
    >
      <p className={`mb-2 text-[10px] ${dark ? "text-violet-400/70" : "text-app-muted"}`}>
        所问：{DEMO_TAROT.question}
      </p>
      <div
        className={
          dark
            ? "mb-3 rounded-xl border border-violet-500/25 bg-[#0a0612]/80 px-1 py-3"
            : "mb-3 rounded-xl border border-app-gold/20 bg-gradient-to-b from-violet-950/20 to-transparent px-1 py-3"
        }
      >
        <TarotSpreadDisplay cards={DEMO_TAROT.cards} size="sm" dark={dark} />
      </div>
      <p className={`text-xs leading-relaxed ${dark ? "text-violet-300/75" : "text-app-muted"}`}>
        {DEMO_TAROT.summary}
      </p>
    </div>
  );
}
