"use client";

import { useMemo } from "react";
import { CalendarDays } from "lucide-react";
import { getTodayHuangli } from "@/lib/huangli";

function TagRow({ label, items, tone }: { label: string; items: string[]; tone: "yi" | "ji" }) {
  const toneClass =
    tone === "yi"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
      : "border-rose-500/30 bg-rose-500/10 text-rose-200";

  return (
    <div className="flex gap-2">
      <span
        className={`mt-0.5 shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-bold tracking-wide ${toneClass}`}
      >
        {label}
      </span>
      <p className="text-xs leading-relaxed text-app-text">{items.join(" · ")}</p>
    </div>
  );
}

export default function TodayHuangliCard() {
  const huangli = useMemo(() => getTodayHuangli(), []);

  return (
    <section className="page-section mb-5">
      <div className="app-card overflow-hidden border-app-gold/25 bg-gradient-to-br from-[#2a1810]/35 via-app-card to-app-bg/80 !p-0">
        <div className="flex items-start gap-2 border-b border-app-border/60 px-4 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-app-gold/15">
            <CalendarDays className="h-4 w-4 text-app-gold" strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-app-gold">今日老黄历</p>
            <p className="text-[10px] text-app-muted">每日宜忌 · 顺时而行</p>
          </div>
          {(huangli.traditionalFestivals.length > 0 || huangli.taoistFestivals.length > 0) && (
            <div className="max-w-[52%] shrink-0 text-right">
              {huangli.traditionalFestivals.length > 0 && (
                <div className="mb-1">
                  <p className="text-[9px] font-medium text-app-gold/80">传统节日</p>
                  <p className="text-[10px] leading-snug text-app-text">
                    {huangli.traditionalFestivals.join(" · ")}
                  </p>
                </div>
              )}
              {huangli.taoistFestivals.length > 0 && (
                <div>
                  <p className="text-[9px] font-medium text-app-accent/80">道教节日</p>
                  <p className="text-[10px] leading-snug text-app-muted">
                    {huangli.taoistFestivals.join(" · ")}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3 px-4 py-3">
          <div className="rounded-xl border border-app-gold/20 bg-app-bg/50 px-3 py-2.5 text-center">
            <p className="text-sm font-medium text-app-text">{huangli.lunarDate}</p>
            <p className="mt-1 text-[11px] text-app-muted">{huangli.dayGanZhi}</p>
          </div>

          <TagRow label="宜" items={huangli.yi} tone="yi" />
          <TagRow label="忌" items={huangli.ji} tone="ji" />
        </div>
      </div>
    </section>
  );
}
