"use client";

import HomeKlinePreview from "@/components/HomeKlinePreview";
import {
  DEMO_KLINE,
  DEMO_STATS,
  DEMO_BAZI,
  DEMO_LIUYAO,
  DEMO_XIANG,
} from "@/lib/demo-data";
import type { KlineData } from "@/lib/types";

function DemoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 border-t border-app-border/50 pt-4">
      <p className="mb-2 text-[11px] font-medium text-app-gold">{title} · 功能示例</p>
      {children}
    </div>
  );
}

const demoKline: KlineData[] = DEMO_KLINE.map((d) => ({
  ...d,
  isCurrent: d.year === 2026,
  trend: d.close >= d.open ? "up" : "down",
}));

export function LiuyaoHubDemo() {
  return (
    <DemoSection title="AI 六爻">
      <div className="app-card !p-3">
        <p className="mb-1 text-[10px] text-app-muted">所问：{DEMO_LIUYAO.question}</p>
        <div className="my-2 flex items-center justify-center gap-3">
          <span className="text-xl font-bold text-app-gold">{DEMO_LIUYAO.guaName}卦</span>
          <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">{DEMO_LIUYAO.luck}</span>
        </div>
        <p className="text-xs leading-relaxed text-app-muted">{DEMO_LIUYAO.analysis}</p>
      </div>
    </DemoSection>
  );
}

export function LifeklineHubDemo() {
  return (
    <DemoSection title="人生 K 线">
      <HomeKlinePreview data={demoKline} />
      <div className="mt-2 grid grid-cols-3 gap-2">
        {[
          { label: "今年", value: DEMO_STATS.thisYear },
          { label: "均势", value: DEMO_STATS.avg },
          { label: "峰值年", value: DEMO_STATS.peakYear },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-app-border bg-app-card p-2 text-center">
            <p className="text-[10px] text-app-muted">{label}</p>
            <p className="text-sm font-semibold text-app-gold">{value}</p>
          </div>
        ))}
      </div>
    </DemoSection>
  );
}

export function BaziHubDemo() {
  return (
    <DemoSection title="八字排盘">
      <div className="app-card !p-3">
        <div className="mb-3 grid grid-cols-4 gap-2 text-center">
          {DEMO_BAZI.pillars.map((p, i) => (
            <div key={i} className="rounded-xl bg-app-bg py-2">
              <p className="text-[10px] text-app-muted">{["年", "月", "日", "时"][i]}</p>
              <p className="text-sm font-bold text-app-accent">{p}</p>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-app-muted">{DEMO_BAZI.solar}</p>
        <p className="text-[11px] text-app-muted">{DEMO_BAZI.lunar}</p>
        <p className="mt-2 text-xs leading-relaxed text-app-text">{DEMO_BAZI.summary}</p>
      </div>
    </DemoSection>
  );
}

export function XiangHubDemo() {
  return (
    <DemoSection title="AI 看相">
      <div className="app-card !p-3">
        <span className="mb-2 inline-block rounded-full bg-app-gold/20 px-2 py-0.5 text-[10px] text-app-gold">
          {DEMO_XIANG.type}分析
        </span>
        <p className="text-xs leading-relaxed text-app-text">{DEMO_XIANG.summary}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {DEMO_XIANG.tags.map((t) => (
            <span key={t} className="rounded-full border border-app-border px-2 py-0.5 text-[10px] text-app-muted">
              {t}
            </span>
          ))}
        </div>
      </div>
    </DemoSection>
  );
}
