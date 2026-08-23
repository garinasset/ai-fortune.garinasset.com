"use client";

import { useMemo } from "react";
import type { KlineData } from "@/lib/types";
import { annotateKlineExtremes } from "@/lib/fortune-chart";

interface HomeKlinePreviewProps {
  data: KlineData[];
}

/** 首页示例用轻量 K 线预览，避免 recharts 在 Tab 切换时崩溃 */
export default function HomeKlinePreview({ data }: HomeKlinePreviewProps) {
  const chartHeight = 140;
  const annotated = useMemo(() => annotateKlineExtremes(data), [data]);

  const bodyBottoms = annotated.map((d) => Math.min(d.open, d.close));
  const bodyTops = annotated.map((d) => Math.max(d.open, d.close));
  const yMin = Math.min(...bodyBottoms);
  const yMax = Math.max(...bodyTops);
  const ySpan = Math.max(yMax - yMin, 1);

  const toBottom = (v: number) => ((v - yMin) / ySpan) * chartHeight;

  return (
    <div className="app-card !p-3">
      <p className="mb-1 text-[10px] text-app-muted">单击看月K线 · 双击看流年分析</p>
      <div className="rounded-xl border border-app-border bg-app-bg/50 px-2 pb-1 pt-0">
        <div className="flex gap-0.5">
          {annotated.map((d) => {
            const up = d.close >= d.open;
            const bodyBottom = Math.min(d.open, d.close);
            const bodyTop = Math.max(d.open, d.close);
            const bottomPx = toBottom(bodyBottom);
            const topPx = toBottom(bodyTop);
            const bodyH = Math.max(6, topPx - bottomPx);
            const markerLabel = d.isBestYear ? "大运之年" : d.isWorstYear ? "大凶之年" : null;
            const markerColor = d.isWorstYear ? "#4a9e6a" : "#e05555";
            return (
              <div key={d.year} className="flex min-w-0 flex-1 flex-col items-center">
                <div className="relative w-full max-w-[22px] overflow-visible" style={{ height: chartHeight }}>
                  {markerLabel && (
                    <span
                      className="absolute left-1/2 z-10 max-w-[28px] -translate-x-1/2 whitespace-nowrap text-center text-[7px] font-bold leading-none"
                      style={{ bottom: topPx + bodyH + 2, color: markerColor }}
                    >
                      {markerLabel}
                    </span>
                  )}
                  <div
                    className="absolute left-0 right-0 rounded-sm"
                    style={{
                      bottom: bottomPx,
                      height: bodyH,
                      backgroundColor: up ? "#e05555" : "#4a9e6a",
                      boxShadow: d.isBestYear || d.isWorstYear ? `0 0 0 1.5px ${markerColor}` : undefined,
                    }}
                  />
                </div>
                <span className="mt-0.5 truncate text-[8px] leading-none text-app-muted">{d.age}岁</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-1.5 flex flex-wrap justify-center gap-2 text-[10px]">
        <span className="flex items-center gap-1 text-red-400">
          <span className="inline-block h-3 w-2 rounded-sm bg-[#e05555]" /> 吉
        </span>
        <span className="flex items-center gap-1 text-green-400">
          <span className="inline-block h-3 w-2 rounded-sm bg-[#4a9e6a]" /> 凶
        </span>
        <span className="flex items-center gap-1 text-red-400">
          <span className="inline-block h-2 w-2 rounded-full border border-[#e05555]" /> 大运之年
        </span>
        <span className="flex items-center gap-1 text-green-400">
          <span className="inline-block h-2 w-2 rounded-full border border-[#4a9e6a]" /> 大凶之年
        </span>
      </div>
    </div>
  );
}
