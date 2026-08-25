"use client";

import { useCallback, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import FormattedAnalysisText from "@/components/FormattedAnalysisText";
import FortuneLoadingSpinner from "@/components/FortuneLoadingSpinner";
import type { BirthInfo, BaziResult } from "@/lib/types";

type FlowTab = "liunian" | "liuyue";

interface BaziFlowPanelProps {
  birthInfo: BirthInfo;
  bazi: BaziResult;
}

export default function BaziFlowPanel({ birthInfo, bazi }: BaziFlowPanelProps) {
  const [tab, setTab] = useState<FlowTab>("liunian");
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(() => new Date().getMonth() + 1);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [meta, setMeta] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const liunianList = useMemo(
    () => bazi.liunian.slice(0, 12),
    [bazi.liunian],
  );

  const fetchFlow = useCallback(
    async (scope: FlowTab, year: number, month?: number) => {
      setLoading(true);
      setError(null);
      setAnalysis(null);
      try {
        const res = await fetch("/api/analyze/bazi/flow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ birthInfo, scope, year, month }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "分析失败");
        setAnalysis(data.analysis as string);
        if (scope === "liunian") {
          setMeta(`${data.year}年 · ${data.ganZhi} · 虚岁 ${data.age} 岁 · 大运 ${data.dayun || "—"}`);
        } else {
          setMeta(`${data.year}年 ${data.month}月 · 流月 ${data.ganZhi}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "分析失败，请稍后重试");
      } finally {
        setLoading(false);
      }
    },
    [birthInfo],
  );

  const handleLiunian = (year: number) => {
    setSelectedYear(year);
    void fetchFlow("liunian", year);
  };

  const handleLiuyue = () => {
    void fetchFlow("liuyue", selectedYear, selectedMonth);
  };

  return (
    <div className="app-card mt-4">
      <div className="mb-3 flex gap-2">
        {(["liunian", "liuyue"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setTab(key);
              setAnalysis(null);
              setError(null);
              setMeta("");
            }}
            className={`flex-1 rounded-lg py-2 text-xs font-medium ${
              tab === key ? "bg-app-accent text-white" : "border border-app-border text-app-muted"
            }`}
          >
            {key === "liunian" ? "流年分析" : "流月分析"}
          </button>
        ))}
      </div>

      {tab === "liunian" && (
        <>
          <p className="mb-2 text-[11px] text-app-muted">点击年份查看 AI 流年详批（含大运参照）</p>
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
            {liunianList.map((item) => (
              <button
                key={item.year}
                type="button"
                onClick={() => handleLiunian(item.year)}
                className={`rounded-lg border px-2 py-2 text-center ${
                  selectedYear === item.year && analysis
                    ? "border-app-accent bg-app-accent/10"
                    : "border-app-border hover:border-app-accent/40"
                }`}
              >
                <p className="text-xs font-semibold text-app-text">{item.year}</p>
                <p className="text-[10px] text-app-accent">{item.ganZhi}</p>
                <p className="text-[9px] text-app-muted">{item.age}岁</p>
              </button>
            ))}
          </div>
        </>
      )}

      {tab === "liuyue" && (
        <>
          <p className="mb-3 text-xs font-medium text-app-text">选择年月，点击下方按钮查看 AI 流月详批</p>
          <div className="rounded-xl border border-app-accent/30 bg-gradient-to-b from-app-accent/8 to-transparent p-3">
            <div className="mb-3 grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-app-text">年份</label>
                <input
                  type="number"
                  className="app-input w-full text-sm"
                  min={new Date().getFullYear()}
                  max={new Date().getFullYear() + 10}
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-app-text">月份</label>
                <select
                  className="app-input w-full text-sm"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>{m} 月</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLiuyue}
              disabled={loading}
              className="app-btn !mb-0 flex w-full items-center justify-center gap-2 py-4 text-[15px] shadow-[0_4px_16px_color-mix(in_srgb,var(--color-accent)_35%,transparent)]"
            >
              <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
              查看 {selectedYear} 年 {selectedMonth} 月流月分析
            </button>
          </div>
        </>
      )}

      {loading && (
        <div className="relative mt-3 min-h-[100px]">
          <FortuneLoadingSpinner compact message="AI 正在推演流年流月…" />
        </div>
      )}

      {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

      {analysis && !loading && (
        <div className="mt-3 rounded-xl border border-app-border/80 bg-app-bg/60 p-3">
          {meta && <p className="mb-2 text-[11px] font-medium text-app-accent">{meta}</p>}
          <FormattedAnalysisText text={analysis} collapsedParagraphs={0} />
        </div>
      )}
    </div>
  );
}
