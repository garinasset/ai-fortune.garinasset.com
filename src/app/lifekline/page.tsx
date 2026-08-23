"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import BirthForm from "@/components/BirthForm";
import LifeklineChart, { MonthlyLineMini } from "@/components/LifeklineChart";
import GenerationOverlay, { GENERATION_LOADING_STEPS } from "@/components/GenerationOverlay";
import FortuneLoadingSpinner from "@/components/FortuneLoadingSpinner";
import PaywallModal from "@/components/PaywallModal";
import OverallOverviewPanel from "@/components/OverallOverviewPanel";
import {
  generateYearAnalysis,
  sliceForwardPeriodFromFull,
} from "@/lib/fortune-chart";
import { calculateBazi } from "@/lib/bazi";
import { canUse, incrementUsage, addHistory } from "@/lib/user-store";
import { usePetFoodRemaining } from "@/hooks/usePetFoodRemaining";
import { formatPetFoodRemaining } from "@/lib/pet-food-remaining";
import {
  saveRecord, buildPersonKey, buildPersonLabel,
} from "@/lib/record-store";
import { saveBirthInfo } from "@/lib/birth-store";
import { ensurePrimaryPersonBeforeCalc, getPersonDisplayName } from "@/lib/person-store";
import { saveSessionResult, loadSessionResult, clearSessionResult } from "@/lib/session-result-cache";
import PrimaryPersonModal from "@/components/PrimaryPersonModal";
import type { BirthInfo, KlineData, YearAnalysis, OverallAnalysis, BaziResult, KlineViewMode } from "@/lib/types";
import { X } from "lucide-react";
import ReportPosterButton, { SharePosterButton } from "@/components/ReportPosterButton";
import { LIFE_YEAR_OPTIONS } from "@/lib/life-year-options";
import PageHeader from "@/components/ui/PageHeader";
import PageCarouselBanner from "@/components/PageCarouselBanner";
import FortuneHubNav, { type FortuneHubTab } from "@/components/FortuneHubNav";
import AiDisclaimer from "@/components/AiDisclaimer";
import LiuyaoHubPanel from "@/components/fortune-hub/LiuyaoHubPanel";
import XiangHubPanel from "@/components/fortune-hub/XiangHubPanel";
import MasterHubPanel from "@/components/fortune-hub/MasterHubPanel";
import AskHubPanel from "@/components/fortune-hub/AskHubPanel";
import RecordsHubPanel from "@/components/fortune-hub/RecordsHubPanel";
import BaziHubPanel from "@/components/fortune-hub/BaziHubPanel";
import { LifeklineHubDemo } from "@/components/fortune-hub/HubFeatureDemos";
import FoodRulesModal from "@/components/FoodRulesModal";
import { PAGE_BANNERS } from "@/lib/page-banners";

function periodTitle(lifeYears: number, drillYear: number | null): string {
  if (drillYear) return `${drillYear}年 · 月度 K 线`;
  if (lifeYears === 1) return `${new Date().getFullYear()}年 · 月度 K 线`;
  if (lifeYears >= 100) return "人生 K 线 · 0–100 岁";
  return `未来 ${lifeYears} 年 · 年 K 线`;
}

function periodSubtitle(lifeYears: number, drillYear: number | null): string {
  if (drillYear) return "横轴：月份 · 单击返回上一级";
  if (lifeYears === 1) return "横轴：月份 · 双击看流年分析";
  if (lifeYears >= 100) return "横轴：年龄(岁) · 单击看月K线 · 双击看流年分析";
  return "横轴：年份 · 单击看月K线 · 双击看流年分析";
}

export default function LifeklinePage() {
  const [phase, setPhase] = useState<"form" | "generating" | "result">("form");
  const [birthInfo, setBirthInfo] = useState<BirthInfo | null>(null);
  const [fullKline, setFullKline] = useState<KlineData[]>([]);
  const [currentYearMonthly, setCurrentYearMonthly] = useState<KlineData[]>([]);
  const [drillYear, setDrillYear] = useState<number | null>(null);
  const [bazi, setBazi] = useState<BaziResult | null>(null);
  const [overall, setOverall] = useState<OverallAnalysis | null>(null);
  const [selectedYear, setSelectedYear] = useState<YearAnalysis | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | undefined>();
  const [paywall, setPaywall] = useState(false);
  const [primaryModal, setPrimaryModal] = useState(false);
  const [lifeYears, setLifeYears] = useState(10);
  const remaining = usePetFoodRemaining();
  const [foodRulesOpen, setFoodRulesOpen] = useState(false);
  const [hubTab, setHubTab] = useState<FortuneHubTab>("lifekline");
  const [error, setError] = useState<string | null>(null);
  const [monthlyKline, setMonthlyKline] = useState<KlineData[]>([]);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [periodLoading, setPeriodLoading] = useState(false);
  const [generateReady, setGenerateReady] = useState(false);
  const [generateSession, setGenerateSession] = useState(0);
  const [cacheVersion, setCacheVersion] = useState(0);
  const periodCacheRef = useRef<Map<number, KlineData[]>>(new Map());
  const monthlyCacheRef = useRef<Map<number, KlineData[]>>(new Map());
  const fullLifeLoadedRef = useRef(false);
  const generatingLifeYearsRef = useRef(10);
  const generateResultRef = useRef<{
    periodKline: KlineData[];
    fullKline: KlineData[];
    overall: OverallAnalysis;
    currentYearMonthly: KlineData[];
  } | null>(null);

  const bumpCache = useCallback(() => setCacheVersion((v) => v + 1), []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "bazi" || tab === "liuyao" || tab === "xiang" || tab === "master" || tab === "ask" || tab === "records") {
      setHubTab(tab as FortuneHubTab);
    }
    const cached = loadSessionResult<{
      birthInfo: BirthInfo;
      fullKline: KlineData[];
      currentYearMonthly?: KlineData[];
      drillYear: number | null;
      bazi: BaziResult | null;
      overall: OverallAnalysis;
      lifeYears: number;
    }>("lifekline");
    if (cached?.birthInfo && cached.overall && (cached.fullKline?.length || cached.currentYearMonthly?.length)) {
      setBirthInfo(cached.birthInfo);
      setFullKline(cached.fullKline);
      setCurrentYearMonthly(cached.currentYearMonthly ?? []);
      setDrillYear(cached.drillYear);
      setBazi(cached.bazi);
      setOverall(cached.overall);
      setLifeYears(cached.lifeYears);
      fullLifeLoadedRef.current = cached.fullKline.length >= 101;
      if (cached.lifeYears >= 100) {
        periodCacheRef.current.set(100, cached.fullKline);
      } else if (cached.fullKline.length < 101) {
        periodCacheRef.current.set(cached.lifeYears, cached.fullKline);
      }
      bumpCache();
      setPhase("result");
    }
  }, [bumpCache]);
  const hasResult = phase === "result" && !!overall;
  const showLifeOverview = hasResult && lifeYears < 100;

  const periodKline = useMemo(() => {
    if (lifeYears === 1) return currentYearMonthly;
    if (lifeYears >= 100) {
      if (fullKline.length >= 101) return fullKline;
      return periodCacheRef.current.get(100) ?? fullKline;
    }
    const cached = periodCacheRef.current.get(lifeYears);
    if (cached?.length) return cached;
    if (fullKline.length >= 101) return sliceForwardPeriodFromFull(fullKline, lifeYears);
    return [];
  // cacheVersion triggers re-read of periodCacheRef
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullKline, lifeYears, currentYearMonthly, cacheVersion]);

  const mainData = useMemo(() => {
    if (!hasResult) return [];
    if (drillYear) return monthlyKline;
    if (lifeYears >= 100) return periodKline.length ? periodKline : fullKline;
    return periodKline;
  }, [hasResult, drillYear, lifeYears, fullKline, periodKline, monthlyKline]);

  const mainViewMode: KlineViewMode = useMemo(() => {
    if (drillYear || lifeYears === 1) return "month";
    if (lifeYears >= 100) return "life";
    return "forward";
  }, [drillYear, lifeYears]);

  const requestMonthlyKline = useCallback(async (info: BirthInfo, year: number) => {
    const res = await fetch("/api/chart/monthly", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ birthInfo: info, year }),
    });
    const data = await res.json();
    if (!res.ok) {
      if (data?.debug) {
        const pos = data.debug.errorPosition ? `位置 ${data.debug.errorPosition}` : "位置未知";
        const detail = data.debug.parseError ? `；${data.debug.parseError}` : "";
        throw new Error(`${data.error ?? "月度K线生成失败"}（${pos}${detail}）`);
      }
      throw new Error(data.error ?? "月度K线生成失败");
    }
    if (!Array.isArray(data.kline) || !data.kline.length) {
      throw new Error("月度K线返回数据不完整");
    }
    return data.kline as KlineData[];
  }, []);

  const requestLifeKline = useCallback(async (
    info: BirthInfo,
    years: number,
    options?: { scope?: "period" | "fullLife" | "fullLifeLocal" },
  ) => {
    const res = await fetch("/api/chart/lifekline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        birthInfo: info,
        years,
        scope: options?.scope,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      if (data?.debug) {
        const pos = data.debug.errorPosition ? `位置 ${data.debug.errorPosition}` : "位置未知";
        const detail = data.debug.parseError ? `；${data.debug.parseError}` : "";
        throw new Error(`${data.error ?? "人生K线生成失败"}（${pos}${detail}）`);
      }
      throw new Error(data.error ?? "人生K线生成失败");
    }

    if (options?.scope === "fullLifeLocal") {
      if (!Array.isArray(data.fullKline) || data.fullKline.length < 101) {
        throw new Error("人生总览返回数据不完整");
      }
      return {
        periodKline: [] as KlineData[],
        fullKline: data.fullKline as KlineData[],
        overall: null as unknown as OverallAnalysis,
      };
    }

    if (options?.scope === "fullLife") {
      if (!Array.isArray(data.fullKline) || !data.overall) {
        throw new Error("人生K线返回数据不完整");
      }
      return {
        periodKline: [] as KlineData[],
        fullKline: data.fullKline as KlineData[],
        overall: data.overall as OverallAnalysis,
      };
    }

    if (!Array.isArray(data.periodKline) || !data.overall) {
      throw new Error("人生K线返回数据不完整");
    }
    return {
      periodKline: data.periodKline as KlineData[],
      fullKline: (Array.isArray(data.fullKline) ? data.fullKline : []) as KlineData[],
      overall: data.overall as OverallAnalysis,
    };
  }, []);

  const applyFullLife = useCallback((kline: KlineData[]) => {
    fullLifeLoadedRef.current = true;
    periodCacheRef.current.set(100, kline);
    setFullKline(kline);
    bumpCache();
  }, [bumpCache]);

  const requestLocalFullLife = useCallback(async (info: BirthInfo) => {
    const data = await requestLifeKline(info, 100, { scope: "fullLifeLocal" });
    return data.fullKline;
  }, [requestLifeKline]);

  const loadPeriodForYears = useCallback(async (info: BirthInfo, years: number) => {
    if (years === 1) {
      const year = new Date().getFullYear();
      const cached = monthlyCacheRef.current.get(year);
      if (cached?.length) {
        setCurrentYearMonthly(cached);
        return;
      }
      setPeriodLoading(true);
      try {
        setError(null);
        const monthly = await requestMonthlyKline(info, year);
        monthlyCacheRef.current.set(year, monthly);
        setCurrentYearMonthly(monthly);
      } catch (err) {
        setError(err instanceof Error ? err.message : "月度K线生成失败，请稍后重试");
      } finally {
        setPeriodLoading(false);
      }
      return;
    }

    if (years >= 100) {
      if (fullLifeLoadedRef.current || fullKline.length >= 101) return;
      setPeriodLoading(true);
      try {
        setError(null);
        const kline = await requestLocalFullLife(info);
        applyFullLife(kline);
      } catch (err) {
        setError(err instanceof Error ? err.message : "人生K线生成失败，请稍后重试");
      } finally {
        setPeriodLoading(false);
      }
      return;
    }

    const cached = periodCacheRef.current.get(years);
    if (cached?.length) return;

    if (fullKline.length >= 101) {
      periodCacheRef.current.set(years, sliceForwardPeriodFromFull(fullKline, years));
      bumpCache();
      return;
    }

    setPeriodLoading(true);
    try {
      setError(null);
      const data = await requestLifeKline(info, years);
      periodCacheRef.current.set(years, data.periodKline);
      bumpCache();
    } catch (err) {
      setError(err instanceof Error ? err.message : "人生K线生成失败，请稍后重试");
    } finally {
      setPeriodLoading(false);
    }
  }, [requestLifeKline, requestMonthlyKline, requestLocalFullLife, applyFullLife, fullKline, bumpCache]);

  useEffect(() => {
    if (phase !== "generating" || !birthInfo) return;
    setGenerateReady(false);
    generateResultRef.current = null;
    const years = generatingLifeYearsRef.current = lifeYears;

    (async () => {
      try {
        if (years === 1) {
          const [lifeData, monthly, fullKlineData] = await Promise.all([
            requestLifeKline(birthInfo, 1),
            requestMonthlyKline(birthInfo, new Date().getFullYear()),
            requestLocalFullLife(birthInfo),
          ]);
          applyFullLife(fullKlineData);
          const currentYear = new Date().getFullYear();
          monthlyCacheRef.current.set(currentYear, monthly);
          periodCacheRef.current.set(1, monthly);
          bumpCache();
          generateResultRef.current = {
            periodKline: lifeData.periodKline,
            fullKline: fullKlineData,
            overall: lifeData.overall,
            currentYearMonthly: monthly,
          };
        } else if (years >= 100) {
          const [lifeData, fullKlineData] = await Promise.all([
            requestLifeKline(birthInfo, 10),
            requestLocalFullLife(birthInfo),
          ]);
          applyFullLife(fullKlineData);
          periodCacheRef.current.set(100, fullKlineData);
          bumpCache();
          generateResultRef.current = {
            periodKline: fullKlineData,
            fullKline: fullKlineData,
            overall: lifeData.overall,
            currentYearMonthly: [],
          };
        } else {
          const [data, fullKlineData] = await Promise.all([
            requestLifeKline(birthInfo, years),
            requestLocalFullLife(birthInfo),
          ]);
          applyFullLife(fullKlineData);
          periodCacheRef.current.set(years, data.periodKline);
          bumpCache();
          generateResultRef.current = {
            periodKline: data.periodKline,
            fullKline: fullKlineData,
            overall: data.overall,
            currentYearMonthly: [],
          };
        }
        setGenerateReady(true);
      } catch (err) {
        console.error("lifekline generate failed", err);
        setError(err instanceof Error ? err.message : "人生K线生成失败，请稍后重试");
        setPhase("form");
      }
    })();
  }, [phase, birthInfo, lifeYears, requestLifeKline, requestMonthlyKline, requestLocalFullLife, applyFullLife, bumpCache]);

  useEffect(() => {
    if (phase !== "result" || !birthInfo || !overall) return;
    if (!fullKline.length && !currentYearMonthly.length && !periodKline.length) return;
    saveSessionResult("lifekline", {
      birthInfo,
      fullKline: fullKline.length >= 101 ? fullKline : (periodKline.length ? periodKline : fullKline),
      currentYearMonthly,
      drillYear,
      bazi,
      overall,
      lifeYears,
    });
  }, [phase, birthInfo, fullKline, currentYearMonthly, periodKline, drillYear, bazi, overall, lifeYears]);

  const handleLifeYearsChange = (value: number) => {
    if (value === lifeYears) return;
    setLifeYears(value);
    setDrillYear(null);
    setMonthlyKline([]);
    setSelectedYear(null);
    setSelectedIndex(undefined);
    if (birthInfo && phase === "result") {
      void loadPeriodForYears(birthInfo, value);
    }
  };

  const handleSubmit = (info: BirthInfo) => {
    if (!ensurePrimaryPersonBeforeCalc()) { setPrimaryModal(true); return; }
    if (!canUse("lifekline")) { setPaywall(true); return; }
    setError(null);
    periodCacheRef.current.clear();
    monthlyCacheRef.current.clear();
    fullLifeLoadedRef.current = false;
    setFullKline([]);
    setCurrentYearMonthly([]);
    bumpCache();
    setBirthInfo(info);
    setGenerateSession((s) => s + 1);
    setPhase("generating");
  };

  const onGenerateComplete = useCallback(() => {
    const pending = generateResultRef.current;
    if (!pending || !birthInfo) return;

    let baziResult: BaziResult | null = null;
    try {
      baziResult = calculateBazi(birthInfo);
    } catch {
      baziResult = null;
    }

    setFullKline((prev) => {
      if (pending.fullKline.length >= 101) return pending.fullKline;
      if (prev.length >= 101) return prev;
      return pending.periodKline;
    });
    setCurrentYearMonthly(pending.currentYearMonthly);
    setDrillYear(null);
    setBazi(baziResult);
    setOverall(pending.overall);
    incrementUsage("lifekline");
    addHistory({
      type: "lifekline",
      title: `${getPersonDisplayName(birthInfo, birthInfo.year + "年")}生辰K线`,
      data: { birthInfo, kline: pending.fullKline, overall: pending.overall, bazi: baziResult },
    });
    const personName = getPersonDisplayName(birthInfo, `命理者${birthInfo.year}`);
    saveRecord({
      type: "lifekline",
      personKey: buildPersonKey(personName, birthInfo),
      personName,
      personLabel: buildPersonLabel(personName, birthInfo),
      title: `人生K线 · ${lifeYears === 1 ? "1年(月)" : lifeYears === 100 ? "全部" : lifeYears + "年"}`,
      summary: pending.overall.summary,
      data: { birthInfo, kline: pending.fullKline, overall: pending.overall, bazi: baziResult, lifeYears },
    });
    saveBirthInfo(birthInfo);
    setPhase("result");
  }, [birthInfo, lifeYears]);

  const handleBarClick = (_index: number, item: KlineData) => {
    if (!birthInfo || item.isMonthly) return;
    const cached = monthlyCacheRef.current.get(item.year);
    if (cached?.length) {
      setMonthlyKline(cached);
      setDrillYear(item.year);
      setSelectedIndex(undefined);
      setSelectedYear(null);
      return;
    }
    (async () => {
      try {
        setError(null);
        setMonthlyLoading(true);
        const kline = await requestMonthlyKline(birthInfo, item.year);
        monthlyCacheRef.current.set(item.year, kline);
        setMonthlyKline(kline);
        setDrillYear(item.year);
        setSelectedIndex(undefined);
        setSelectedYear(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "月度K线生成失败，请稍后重试");
      } finally {
        setMonthlyLoading(false);
      }
    })();
  };

  const handleBarDoubleClick = (index: number, item: KlineData) => {
    if (item.isMonthly) return;
    setSelectedIndex(index);
    setSelectedYear(generateYearAnalysis(item));
  };

  const handleBackFromDrill = () => {
    setDrillYear(null);
    setMonthlyKline([]);
    setSelectedIndex(undefined);
  };

  if (phase === "generating" && hubTab === "lifekline") {
    return (
      <>
        <PageHeader
          title="人生 K 线"
          subtitle={`命势推演，可视化排盘，${formatPetFoodRemaining(remaining)}`}
        />
        <PageCarouselBanner slides={PAGE_BANNERS.lifekline} className="!mb-3 !pt-0" />
        <FortuneHubNav active={hubTab} onChange={setHubTab} />
        <div className="relative min-h-[320px]">
          <GenerationOverlay
            embedded
            taskReady={generateReady}
            onComplete={onGenerateComplete}
            steps={GENERATION_LOADING_STEPS}
            resetKey={generateSession}
          />
        </div>
      </>
    );
  }

  const showKlineContent = hubTab === "lifekline";
  const showBaziContent = hubTab === "bazi";

  return (
    <>
      <PageHeader
        title="人生 K 线"
        subtitle={
          <>
            命势推演，可视化排盘，{formatPetFoodRemaining(remaining)}（
            <button
              type="button"
              onClick={() => setFoodRulesOpen(true)}
              className="font-semibold text-app-accent underline decoration-app-accent/40 underline-offset-2"
            >
              查看灵丹规则
            </button>
            ）
          </>
        }
      />

      <PageCarouselBanner slides={PAGE_BANNERS.lifekline} className="!mb-3 !pt-0" />

      <FortuneHubNav active={hubTab} onChange={setHubTab} />

      {hubTab === "liuyao" && <LiuyaoHubPanel />}
      {hubTab === "xiang" && <XiangHubPanel />}
      {hubTab === "master" && <MasterHubPanel />}
      {hubTab === "ask" && <AskHubPanel />}
      {hubTab === "records" && <RecordsHubPanel />}

      {showBaziContent && <BaziHubPanel />}

      {showKlineContent && phase === "form" && (
        <>
          <div className="app-card !p-3 mb-3">
            <BirthForm onSubmit={handleSubmit} />
          </div>
          {error && <p className="mb-3 text-xs text-red-400">{error}</p>}
          <div className="mb-2">
            <p className="mb-1 text-[11px] font-medium text-app-muted">推演年数</p>
            <div className="flex flex-wrap gap-1.5">
              {LIFE_YEAR_OPTIONS.map(({ label, value }) => (
                <button key={value} onClick={() => setLifeYears(value)}
                  className={`rounded-lg px-3 py-1 text-xs ${
                    lifeYears === value ? "bg-app-accent text-white" : "border border-app-border text-app-muted"
                  }`}>{label}</button>
              ))}
            </div>
          </div>
          <LifeklineHubDemo />
        </>
      )}

      {showKlineContent && hasResult && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {LIFE_YEAR_OPTIONS.map(({ label, value }) => (
                <button key={value} onClick={() => handleLifeYearsChange(value)} disabled={periodLoading || monthlyLoading}
              className={`rounded-lg px-3 py-1 text-xs ${
                lifeYears === value ? "bg-app-accent text-white" : "border border-app-border text-app-muted"
              } disabled:opacity-40`}>{label}</button>
          ))}
        </div>
      )}

      {showKlineContent && hasResult && error && (
        <p className="mb-3 text-xs text-red-400">{error}</p>
      )}

      {showKlineContent && hasResult && periodLoading && (
        <div className="relative mb-3 min-h-[140px] rounded-xl border border-app-border/60 bg-app-card/40">
          <FortuneLoadingSpinner
            compact
            message="正在刷新当前推演年数的 K 线数据…"
          />
        </div>
      )}

      {showKlineContent && (phase === "form" || hasResult) && (
        <>
          <LifeklineChart
            data={hasResult && !periodLoading ? mainData : []}
            viewMode={hasResult ? mainViewMode : "forward"}
            birthInfo={birthInfo}
            onBarClick={handleBarClick}
            onBarDoubleClick={handleBarDoubleClick}
            selectedIndex={selectedIndex}
            empty={!hasResult}
            title={hasResult ? periodTitle(lifeYears, drillYear) : "推演 K 线"}
            subtitle={hasResult ? periodSubtitle(lifeYears, drillYear) : undefined}
            showBack={!!drillYear}
            onBack={handleBackFromDrill}
          />
          {hasResult && <AiDisclaimer className="mt-2" />}

          {drillYear && monthlyLoading && (
            <p className="mt-2 text-center text-xs text-app-accent animate-pulse">正在加载该年的月度真实K线…</p>
          )}

          {showLifeOverview && (
            <div className="mt-3">
              <LifeklineChart
                data={fullKline.length >= 101 ? fullKline : []}
                viewMode="life"
                birthInfo={birthInfo}
                onBarClick={handleBarClick}
                onBarDoubleClick={handleBarDoubleClick}
                compact
                title="人生总览 · 0–100 岁"
                subtitle="完整人生 K 线 · 单击某年查看月K线"
                empty={fullKline.length < 101}
              />
            </div>
          )}

          <OverallOverviewPanel overall={overall} filled={hasResult} showBoostCta={hasResult} />

          {hasResult && overall && birthInfo && (
            <>
              <div className="mt-4 space-y-2">
                <ReportPosterButton
                  data={{
                    title: "人生K线运势报告",
                    subtitle: buildPersonLabel(birthInfo.name || "匿名", birthInfo),
                    summary: overall.summary,
                    klineCharts: (() => {
                      const charts: { title: string; data: KlineData[] }[] = [];
                      if (drillYear) {
                        charts.push({ title: `${drillYear}年 · 月度 K 线`, data: mainData });
                      } else {
                        charts.push({ title: periodTitle(lifeYears, null), data: periodKline });
                      }
                      if (showLifeOverview) {
                        charts.push({ title: "人生总览 · 0–100 岁", data: fullKline });
                      }
                      return charts;
                    })(),
                    baziText: bazi ? `${bazi.bazi.year} ${bazi.bazi.month} ${bazi.bazi.day} ${bazi.bazi.hour} · ${bazi.dayMaster}` : undefined,
                    dimensions: overall.dimensions.map((d) => ({ label: d.label, score: d.score, text: d.text, key: d.key })),
                    type: "lifekline",
                  }}
                />
                <SharePosterButton
                  data={{
                    title: "我的人生K线",
                    summary: overall.summary,
                    klineCharts: showLifeOverview
                      ? [
                          { title: periodTitle(lifeYears, drillYear), data: drillYear ? mainData : periodKline },
                          { title: "人生总览 · 0–100 岁", data: fullKline },
                        ]
                      : [{ title: periodTitle(lifeYears, drillYear), data: drillYear ? mainData : periodKline }],
                    dimensions: overall.dimensions.map((d) => ({ label: d.label, score: d.score, key: d.key })),
                    type: "lifekline",
                  }}
                />
              </div>

              <button onClick={() => {
                clearSessionResult("lifekline");
                periodCacheRef.current.clear();
                monthlyCacheRef.current.clear();
                fullLifeLoadedRef.current = false;
                setPhase("form");
                setSelectedYear(null);
                setDrillYear(null);
                setFullKline([]);
                setCurrentYearMonthly([]);
                setOverall(null);
                setBazi(null);
                bumpCache();
              }}
                className="app-btn-outline mt-4">
                重新测算
              </button>
            </>
          )}
        </>
      )}

      {selectedYear && birthInfo && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-app-border bg-app-card p-5 sm:rounded-3xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-app-text">
                {selectedYear.age}岁 · {selectedYear.year}年 流年分析
              </h3>
              <button onClick={() => { setSelectedYear(null); setSelectedIndex(undefined); }}>
                <X className="h-5 w-5 text-app-muted" />
              </button>
            </div>
            <div className="mb-3 flex items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-sm font-bold ${
                selectedYear.luck === "吉" ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
              }`}>{selectedYear.luck}</span>
              <span className="rounded-full px-2 py-0.5 text-xs text-app-muted">{selectedYear.score}分</span>
            </div>
            <p className="mb-3 text-xs leading-relaxed text-app-muted">{selectedYear.summary}</p>
            <ul className="mb-4 space-y-1">
              {selectedYear.highlights.map((h, i) => (
                <li key={i} className="text-[11px] text-app-muted">· {h}</li>
              ))}
            </ul>
            <p className="mb-2 text-xs font-medium text-app-text">{selectedYear.year}年 · 12个月运势</p>
            <MonthlyLineMini birthInfo={birthInfo} year={selectedYear.year} />
          </div>
        </div>
      )}

      <PaywallModal open={paywall} onClose={() => setPaywall(false)} feature="人生K线" />
      <PrimaryPersonModal open={primaryModal} onClose={() => setPrimaryModal(false)} />
      <FoodRulesModal open={foodRulesOpen} onClose={() => setFoodRulesOpen(false)} />
    </>
  );
}
