"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import {
  getRecordsByPerson, getRecordDisplayLabel, type CalcRecord,
} from "@/lib/record-store";
import type { BirthInfo, KlineData, OverallAnalysis, BaziResult, AnalysisResult } from "@/lib/types";
import LifeklineChart from "@/components/LifeklineChart";
import OverallOverviewPanel from "@/components/OverallOverviewPanel";
import AnalysisPanel from "@/components/AnalysisPanel";
import FormattedAnalysisText from "@/components/FormattedAnalysisText";

export default function PersonRecordsPage() {
  const params = useParams();
  const personKey = decodeURIComponent(params.personKey as string);
  const [records, setRecords] = useState<CalcRecord[]>([]);
  const [selected, setSelected] = useState<CalcRecord | null>(null);

  useEffect(() => {
    const list = getRecordsByPerson(personKey);
    setRecords(list);
    if (list.length > 0) setSelected(list[0]);
  }, [personKey]);

  const personName = records[0]?.personName ?? "测算记录";

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="px-4 pb-4">
      <Link href="/records" className="mb-3 inline-flex items-center gap-1 text-xs text-app-accent">
        <ChevronLeft className="h-4 w-4" /> 返回我的测算
      </Link>

      <header className="mb-4">
        <h1 className="page-title">{personName}</h1>
        <p className="text-xs text-app-muted">{records[0]?.personLabel}</p>
      </header>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {records.map((r) => (
          <button key={r.id} onClick={() => setSelected(r)}
            className={`shrink-0 rounded-xl border px-3 py-2 text-left ${
              selected?.id === r.id ? "border-app-accent bg-app-accent/10" : "border-app-border"
            }`}>
            <p className="text-[11px] font-medium text-app-text">{getRecordDisplayLabel(r)}</p>
            <p className="text-[10px] text-app-muted">{formatTime(r.createdAt)}</p>
          </button>
        ))}
      </div>

      {selected && <RecordDetail record={selected} />}
    </div>
  );
}

function RecordDetail({ record }: { record: CalcRecord }) {
  const data = (record.data && typeof record.data === "object" ? record.data : {}) as Record<string, unknown>;

  if (record.type === "lifekline") {
    const birthInfo = data.birthInfo as BirthInfo | undefined;
    const kline = Array.isArray(data.kline) ? (data.kline as KlineData[]) : [];
    const overall = data.overall as OverallAnalysis | undefined;
    const bazi = data.bazi as BaziResult | undefined;
    const analysis = data.analysis as AnalysisResult | undefined;
    const kind = data.kind as string | undefined;
    if (kind === "bazi" && birthInfo && bazi) {
      return (
        <div>
          <p className="mb-3 text-xs text-app-muted">{record.summary}</p>
          {analysis ? (
            <AnalysisPanel result={analysis} bazi={bazi} />
          ) : (
            <div className="app-card"><p className="text-xs text-app-muted">未找到历史分析正文</p></div>
          )}
        </div>
      );
    }
    if (!birthInfo || kline.length === 0 || !overall) {
      return (
        <div className="app-card">
          <p className="text-xs text-app-muted">{record.summary || "记录数据不完整，无法展示图表"}</p>
        </div>
      );
    }
    return (
      <div>
        <p className="mb-3 text-xs text-app-muted">{record.summary}</p>
        <LifeklineChart data={kline} birthInfo={birthInfo} />
        <OverallOverviewPanel overall={overall} filled />
        {bazi && analysis && (
          <div className="mt-4">
            <AnalysisPanel result={analysis} bazi={bazi} />
          </div>
        )}
      </div>
    );
  }

  if (record.type === "bazi") {
    const bazi = data.bazi as BaziResult | undefined;
    const analysis = data.analysis as AnalysisResult | undefined;
    if (!bazi) {
      return (
        <div className="app-card">
          <p className="text-xs text-app-muted">{record.summary || "记录数据不完整"}</p>
        </div>
      );
    }
    return (
      <div>
        <p className="mb-3 text-xs text-app-muted">{record.summary}</p>
        {analysis ? (
          <AnalysisPanel result={analysis} bazi={bazi} />
        ) : (
          <div className="app-card"><p className="text-xs text-app-muted">未找到历史分析正文</p></div>
        )}
      </div>
    );
  }

  if (record.type === "aiAsk") {
    const q = data.question as string;
    const a = data.answer as string;
    return (
      <div className="app-card space-y-3">
        <div className="rounded-xl bg-app-bg p-3">
          <p className="text-[10px] text-app-muted">问题</p>
          <p className="text-sm text-app-text">{q}</p>
        </div>
        <div className="rounded-xl border border-app-accent/30 bg-app-accent/5 p-3">
          <p className="text-[10px] text-app-accent">AI 回答</p>
          <p className="text-sm leading-relaxed text-app-text">{a}</p>
        </div>
      </div>
    );
  }

  if (record.type === "master") {
    return (
      <div className="app-card space-y-2 text-sm">
        <p><span className="text-app-muted">所问：</span>{data.question as string}</p>
        {data.reply ? (
          <div className="rounded-xl bg-app-gold/10 p-3">
            <p className="text-[10px] text-app-gold">大师回复</p>
            <p className="text-xs leading-relaxed">{data.reply as string}</p>
          </div>
        ) : (
          <p className="text-xs text-app-muted">等待大师回复中…</p>
        )}
      </div>
    );
  }

  if (record.type === "liuyao") {
    const result = data.result as Record<string, string>;
    return (
      <div className="app-card text-center">
        <p className="mb-3 text-lg font-bold text-app-gold">{result.guaName}卦 · {result.luck}</p>
        <FormattedAnalysisText text={result.analysis} collapsedParagraphs={0} />
        {result.advice && (
          <div className="mt-3">
            <FormattedAnalysisText text={`💡 ${result.advice}`} collapsedParagraphs={0} />
          </div>
        )}
      </div>
    );
  }

  if (record.type === "xiang") {
    return (
      <div className="app-card">
        <FormattedAnalysisText text={data.summary as string} collapsedParagraphs={0} />
      </div>
    );
  }

  return (
    <div className="app-card">
      <p className="text-xs text-app-muted">{record.summary}</p>
    </div>
  );
}
