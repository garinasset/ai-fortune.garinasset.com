"use client";

import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import {
  ComposedChart, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine, Customized,
} from "recharts";
import { Maximize2, Minimize2, BarChart2, TrendingUp, X, ChevronLeft } from "lucide-react";
import type { BirthInfo, KlineData, KlineViewMode } from "@/lib/types";
import { annotateKlineExtremes, generateMonthlyKline } from "@/lib/fortune-chart";

interface LifeklineChartProps {
  data: KlineData[];
  viewMode?: KlineViewMode;
  birthInfo?: BirthInfo | null;
  onBarClick?: (index: number, item: KlineData) => void;
  onBarDoubleClick?: (index: number, item: KlineData) => void;
  selectedIndex?: number;
  compact?: boolean;
  empty?: boolean;
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
}

type ChartRow = KlineData & {
  xLabel: string;
  bodyBase: number;
  bodyHeight: number;
  scoreRel: number;
  barLabel: string;
  index: number;
};

type ChartOffset = { left: number; right: number; top: number; bottom: number };

function getTopMarkerLabel(entry: KlineData, viewMode: KlineViewMode): string | null {
  if (entry.isBestYear) return viewMode === "month" ? "大运之月" : "大运之年";
  if (entry.isWorstYear) {
    if (entry.isCurrent) return viewMode === "month" ? "今月·大凶" : "今年·大凶之年";
    return viewMode === "month" ? "大凶之月" : "大凶之年";
  }
  if (entry.isCurrent) return viewMode === "month" ? "今月" : "今年";
  return null;
}

function markerColor(entry: KlineData): string {
  if (entry.isWorstYear) return "#4a9e6a";
  if (entry.isCurrent) return "#c45c48";
  return "#e05555";
}

/** 根据数据实际分数计算 Y 轴范围：底部贴近最低分，减少无意义空白 */
function computeScoreDomain(data: KlineData[]): [number, number] {
  if (!data.length) return [0, 100];

  let min = Infinity;
  let max = -Infinity;
  for (const d of data) {
    min = Math.min(min, d.low, d.open, d.close);
    max = Math.max(max, d.high, d.open, d.close);
  }

  const span = Math.max(max - min, 1);
  const padBottom = 0.5;
  const padTop = Math.min(8, Math.max(3, span * 0.1));

  let lo = Math.max(0, min - padBottom);
  let hi = Math.min(100, max + padTop);

  if (hi - lo < 16) {
    const mid = (max + min) / 2;
    lo = Math.max(0, mid - 8);
    hi = Math.min(100, mid + 8);
  }

  return [Math.floor(lo), Math.ceil(hi)];
}

/** 生成与 domain 一致的真实分数刻度 */
function buildScoreAxisTicks(lo: number, hi: number): number[] {
  const span = hi - lo;
  const step = span > 50 ? 20 : span > 28 ? 10 : span > 14 ? 5 : 2;
  const ticks: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) {
    ticks.push(v);
  }
  if (!ticks.length || ticks[0]! > lo + step * 0.4) {
    ticks.unshift(Math.round(lo));
  }
  if (ticks[ticks.length - 1]! < hi - step * 0.4) {
    ticks.push(Math.round(hi));
  }
  return [...new Set(ticks)].sort((a, b) => a - b);
}

/** 按 slot 宽度计算柱宽 */
function resolveBarWidth(slotW: number, count: number, maxCap: number): number {
  const ratio = count > 50 ? 0.68 : 0.78;
  const floor = count > 50 ? 2 : 3;
  return Math.max(floor, Math.min(slotW * ratio, maxCap));
}

function buildPlotLayout(width: number, height: number, offset: ChartOffset, count: number) {
  const plotLeft = offset.left;
  const plotTop = offset.top;
  const plotW = Math.max(width - offset.left - offset.right, 1);
  const plotH = Math.max(height - offset.top - offset.bottom, 1);
  const slotW = plotW / Math.max(count, 1);
  return { plotLeft, plotTop, plotW, plotH, slotW };
}

function scaleY(plotTop: number, plotH: number, ySpan: number, rel: number): number {
  return plotTop + plotH - (rel / ySpan) * plotH;
}

function KlineLayer({
  width = 0,
  height = 0,
  offset,
  data,
  ySpan,
  maxBarSize,
  labelFontSize,
  viewMode,
  selectedIndex,
  onPress,
  onHover,
}: {
  width?: number;
  height?: number;
  offset?: ChartOffset;
  data: ChartRow[];
  ySpan: number;
  maxBarSize: number;
  labelFontSize: number;
  viewMode: KlineViewMode;
  selectedIndex?: number;
  onPress: (index: number) => void;
  onHover: (index: number | null) => void;
}) {
  if (!data.length || !offset || width <= 0 || height <= 0) return null;

  const { plotLeft, plotTop, plotH, slotW } = buildPlotLayout(width, height, offset, data.length);
  const yAt = (rel: number) => scaleY(plotTop, plotH, ySpan, rel);

  const strokeFor = (entry: ChartRow, i: number) => {
    if (entry.isBirth) return "#d4a574";
    if (entry.isCurrent) return "#c45c48";
    if (entry.isBestYear) return "#e05555";
    if (entry.isWorstYear) return "#4a9e6a";
    if (selectedIndex === i) return "#c45c48";
    return "none";
  };

  const strokeWidthFor = (entry: ChartRow, i: number) => {
    const isKey = entry.isBirth || entry.isCurrent || entry.isBestYear || entry.isWorstYear || selectedIndex === i;
    if (isKey && (entry.isBirth || entry.isCurrent) && viewMode === "life") return 3;
    if (isKey) return 2;
    return 0;
  };

  return (
    <g className="kline-layer">
      {data.map((entry, i) => {
        const cx = plotLeft + (i + 0.5) * slotW;
        const barW = resolveBarWidth(slotW, data.length, maxBarSize);
        const x0 = cx - barW / 2;
        const yTop = yAt(entry.bodyBase + entry.bodyHeight);
        const yBottom = yAt(entry.bodyBase);
        const bodyH = Math.max(yBottom - yTop, 1);
        const fill = entry.close >= entry.open ? "#e05555" : "#4a9e6a";
        const topLabel = getTopMarkerLabel(entry, viewMode);

        return (
          <g
            key={i}
            cursor="pointer"
            onClick={() => onPress(i)}
            onMouseEnter={() => onHover(i)}
            onMouseLeave={() => onHover(null)}
            onTouchStart={() => onHover(i)}
            onTouchEnd={() => onHover(null)}
          >
            <rect
              x={x0}
              y={yTop}
              width={barW}
              height={bodyH}
              fill={fill}
              stroke={strokeFor(entry, i)}
              strokeWidth={strokeWidthFor(entry, i)}
              rx={0.5}
            />
            {entry.barLabel ? (
              <text x={cx} y={yBottom + 12} textAnchor="middle" fontSize={labelFontSize} fill="#888">
                {entry.barLabel}
              </text>
            ) : null}
            {topLabel ? (
              <g>
                <line
                  x1={cx}
                  y1={yTop}
                  x2={cx}
                  y2={yTop - 26}
                  stroke={markerColor(entry)}
                  strokeWidth={1.5}
                />
                <text
                  x={cx}
                  y={yTop - 28}
                  textAnchor="middle"
                  fontSize={9}
                  fontWeight="600"
                  fill={markerColor(entry)}
                >
                  {topLabel}
                </text>
              </g>
            ) : null}
          </g>
        );
      })}
    </g>
  );
}

export default function LifeklineChart({
  data,
  viewMode = "life",
  birthInfo,
  onBarClick,
  onBarDoubleClick,
  selectedIndex,
  compact,
  empty,
  title,
  subtitle,
  showBack,
  onBack,
}: LifeklineChartProps) {
  const [mounted, setMounted] = useState(false);
  const [chartReady, setChartReady] = useState(false);
  const [chartMode, setChartMode] = useState<"kline" | "line">("kline");
  const [fullscreen, setFullscreen] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isLifeFull = viewMode === "life" && data.length > 50;
  const annotatedData = useMemo(() => annotateKlineExtremes(data), [data]);
  const hasTopMarkers = annotatedData.some((d) => getTopMarkerLabel(d, viewMode));
  const height = compact ? 280 : fullscreen ? 580 : 420;

  const yDomain = useMemo(
    () => computeScoreDomain(annotatedData),
    [annotatedData],
  );

  const yAxisTicks = useMemo(
    () => buildScoreAxisTicks(yDomain[0], yDomain[1]),
    [yDomain],
  );

  const yMin = yDomain[0];
  const ySpan = Math.max(yDomain[1] - yDomain[0], 1);

  const yAxisTickValues = useMemo(
    () => yAxisTicks.map((t) => t - yMin),
    [yAxisTicks, yMin],
  );

  const maxBarSize = isLifeFull ? 8 : viewMode === "life" ? 10 : 14;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;
    const el = containerRef.current;
    const check = () => {
      const { width, height: h } = el.getBoundingClientRect();
      setChartReady(width > 0 && h > 0);
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [mounted, height]);

  const labelFontSize = data.length > 50 ? 6 : data.length > 20 ? 7 : 9;
  const bottomMargin = data.length > 50 ? 32 : data.length > 15 ? 30 : 24;
  const topMargin = hasTopMarkers ? 42 : 16;

  const chartData = useMemo((): ChartRow[] => annotatedData.map((d, i) => {
    const luckLabel = d.close >= d.open ? "吉" : "凶";
    const showLabel = !isLifeFull || (d.age ?? 0) % 5 === 0;
    const bodyLow = Math.min(d.open, d.close);
    const minBody = ySpan * 0.025;
    return {
      ...d,
      xLabel: d.xLabel ?? (d.isMonthly ? `${d.month}月` : d.age === 0 ? "出生" : `${d.age}岁`),
      bodyBase: bodyLow - yMin,
      bodyHeight: Math.max(Math.abs(d.close - d.open), minBody),
      scoreRel: d.score - yMin,
      barLabel: showLabel ? luckLabel : "",
      index: i,
    };
  }), [annotatedData, isLifeFull, yMin, ySpan]);

  const xAxisLabel = viewMode === "month" ? "月份" : viewMode === "forward" ? "年份" : "年龄(岁)";
  const tickInterval = data.length <= 12 ? 0 : data.length <= 20 ? 1 : Math.max(1, Math.floor(data.length / 8));

  const handleBarPress = useCallback((index: number) => {
    if (empty) return;
    const item = data[index];
    if (!item) return;
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      onBarDoubleClick?.(index, item);
      return;
    }
    clickTimer.current = setTimeout(() => {
      clickTimer.current = null;
      onBarClick?.(index, item);
    }, 280);
  }, [empty, data, onBarClick, onBarDoubleClick]);

  const hint = empty
    ? "填写信息后生成 K 线"
    : viewMode === "month"
      ? "单击返回 · 双击看分析"
      : "单击看月K线 · 双击看流年分析";

  const chartContent = (
    <>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          {showBack && onBack && (
            <button onClick={onBack} className="mb-1 flex items-center gap-0.5 text-[10px] text-app-accent">
              <ChevronLeft className="h-3 w-3" /> 返回
            </button>
          )}
          {title && !compact && <h3 className="text-sm font-medium text-app-text">{title}</h3>}
          {subtitle && <p className="text-[10px] text-app-gold">{subtitle}</p>}
          <p className="text-[10px] text-app-muted">{hint}</p>
        </div>
        {!empty && (
          <div className="flex shrink-0 items-center gap-1">
            <button onClick={() => setChartMode("kline")}
              className={`rounded-lg px-2 py-1 text-[10px] ${chartMode === "kline" ? "bg-app-accent text-white" : "text-app-muted"}`}>
              <BarChart2 className="inline h-3 w-3" /> K线
            </button>
            <button onClick={() => setChartMode("line")}
              className={`rounded-lg px-2 py-1 text-[10px] ${chartMode === "line" ? "bg-app-accent text-white" : "text-app-muted"}`}>
              <TrendingUp className="inline h-3 w-3" /> 折线
            </button>
            {!compact && (
              <button onClick={() => setFullscreen(!fullscreen)} className="rounded-lg p-1 text-app-muted hover:text-app-accent">
                {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
            )}
          </div>
        )}
      </div>

      {empty || data.length === 0 ? (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-app-border bg-app-bg/50"
          style={{ height }}>
          <p className="text-xs text-app-muted">暂无 K 线数据</p>
        </div>
      ) : (
        <div ref={containerRef} className="w-full min-w-0" style={{ height }}>
          {chartReady ? (
          <ResponsiveContainer width="100%" height="100%">
          {chartMode === "kline" ? (
            <ComposedChart
              data={chartData}
              margin={{ top: topMargin, right: 8, left: 0, bottom: bottomMargin }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="xLabel"
                type="category"
                tick={{ fill: "var(--color-muted)", fontSize: 8 }}
                interval={tickInterval}
                angle={data.length > 15 ? -35 : 0}
                textAnchor={data.length > 15 ? "end" : "middle"}
                height={data.length > 15 ? 48 : 30}
                label={!compact ? { value: xAxisLabel, position: "insideBottom", offset: -4, fontSize: 9, fill: "var(--color-muted)" } : undefined}
              />
              <YAxis
                domain={[0, ySpan]}
                ticks={yAxisTickValues}
                allowDecimals={false}
                tick={{ fill: "var(--color-muted)", fontSize: 9 }}
                tickFormatter={(v) => String(Math.round(Number(v) + yMin))}
                width={36}
                label={!compact ? { value: "运势分", angle: -90, position: "insideLeft", fontSize: 9, fill: "var(--color-muted)" } : undefined}
              />
              <Tooltip
                active={hoverIndex !== null}
                payload={hoverIndex !== null ? [{ payload: chartData[hoverIndex] }] : []}
                content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const d = payload[0].payload as ChartRow;
                const topLabel = getTopMarkerLabel(d, viewMode);
                return (
                  <div className="rounded-lg border border-app-border bg-app-card px-2 py-1 text-[11px]">
                    {d.isMonthly ? (
                      <p>{d.year}年 {d.month}月 · {d.age}岁 {d.isCurrent && "· 今月"}</p>
                    ) : (
                      <p>{d.age}岁 · {d.year}年 {d.isBirth && "· 出生"} {d.isCurrent && "· 今年"}</p>
                    )}
                    <p style={{ color: d.close >= d.open ? "#e05555" : "#4a9e6a" }}>
                      {topLabel ?? d.barLabel} · {d.score}分
                    </p>
                  </div>
                );
              }} />
              <ReferenceLine y={ySpan / 2} stroke="var(--color-border)" strokeDasharray="4 4" />
              <Customized
                component={(props: {
                  width?: number;
                  height?: number;
                  offset?: ChartOffset;
                }) => (
                  <KlineLayer
                    width={props.width}
                    height={props.height}
                    offset={props.offset}
                    data={chartData}
                    ySpan={ySpan}
                    maxBarSize={maxBarSize}
                    labelFontSize={labelFontSize}
                    viewMode={viewMode}
                    selectedIndex={selectedIndex}
                    onPress={handleBarPress}
                    onHover={setHoverIndex}
                  />
                )}
              />
            </ComposedChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 16, right: 4, left: -8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="xLabel" type="category" tick={{ fill: "var(--color-muted)", fontSize: 8 }} interval={tickInterval} />
              <YAxis
                domain={[0, ySpan]}
                ticks={yAxisTickValues}
                allowDecimals={false}
                tick={{ fill: "var(--color-muted)", fontSize: 9 }}
                tickFormatter={(v) => String(Math.round(Number(v) + yMin))}
              />
              <Tooltip />
              <Line type="monotone" dataKey="scoreRel" stroke="#c45c48" strokeWidth={2} dot={false}
                activeDot={{ r: 4, onClick: (_, e) => handleBarPress((e as { index?: number }).index ?? 0) }} />
            </LineChart>
          )}
          </ResponsiveContainer>
          ) : (
            <div className="h-full animate-pulse rounded-xl bg-app-border/30" />
          )}
        </div>
      )}

      {!empty && data.length > 0 && (
        <div className="mt-2 flex flex-wrap justify-center gap-3 text-[10px]">
          <span className="flex items-center gap-1 text-red-400">
            <span className="inline-block h-3 w-2 rounded-sm bg-[#e05555]" /> 吉
          </span>
          <span className="flex items-center gap-1 text-green-400">
            <span className="inline-block h-3 w-2 rounded-sm bg-[#4a9e6a]" /> 凶
          </span>
        </div>
      )}
    </>
  );

  return (
    <>
      <div className={compact ? "app-card !p-3" : "app-card !p-3"}>
        {!mounted ? (
          <div className="animate-pulse rounded-xl bg-app-border/30" style={{ height: compact ? 280 : 420 }} />
        ) : (
          chartContent
        )}
      </div>
      {fullscreen && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-app-bg p-4">
          <div className="mb-2 flex justify-between">
            <h3 className="font-medium text-app-text">全屏查看</h3>
            <button onClick={() => setFullscreen(false)}><X className="h-5 w-5" /></button>
          </div>
          <div className="flex-1 app-card">{chartContent}</div>
        </div>
      )}
    </>
  );
}

export function MonthlyLineMini({ birthInfo, year }: { birthInfo: BirthInfo; year: number }) {
  const data = generateMonthlyKline(birthInfo, year);
  return (
    <LifeklineChart
      data={data}
      viewMode="month"
      birthInfo={birthInfo}
      compact
      title={`${year}年 月度K线`}
    />
  );
}
