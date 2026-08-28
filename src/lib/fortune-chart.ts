import type { BirthInfo, KlineData, BaziResult, OverallAnalysis } from "./types";
import { calculateBazi } from "./bazi";
import { toSolarBirthInfo, normalizeBirthInfo } from "./birth-utils";

function safeCalculateBazi(info: BirthInfo): BaziResult | null {
  try {
    return calculateBazi(info);
  } catch {
    return null;
  }
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function resolveSolarInfo(info: BirthInfo): BirthInfo {
  return toSolarBirthInfo(normalizeBirthInfo(info));
}

export function hashBirth(info: BirthInfo): number {
  const solar = resolveSolarInfo(info);
  const cal = info.calendar === "lunar" ? 2 : 1;
  return (
    solar.year * 10000 + solar.month * 100 + solar.day +
    solar.hour * 60 + solar.minute + (solar.gender === "male" ? 1 : 0) + cal
  );
}

function ganZhiScore(ganZhi: string, seed: number): number {
  let score = 50;
  ganZhi.split("").forEach((c, i) => {
    score += (c.charCodeAt(0) * (i + 1) + seed) % 20 - 10;
  });
  return Math.max(15, Math.min(95, score));
}

export function getCurrentAge(birthYear: number, birthMonth = 1, birthDay = 1): number {
  const now = new Date();
  let age = now.getFullYear() - birthYear;
  const month = now.getMonth() + 1;
  const day = now.getDate();
  if (month < birthMonth || (month === birthMonth && day < birthDay)) age--;
  return Math.max(0, age);
}

/** 标记 K 线中的大运之年（最佳阳K）与大凶之年（最差阴K） */
export function annotateKlineExtremes(data: KlineData[]): KlineData[] {
  if (data.length === 0) return data;

  let bestIdx = -1;
  let worstIdx = -1;
  let bestBody = -1;
  let worstBody = -1;

  data.forEach((d, i) => {
    const body = Math.abs(d.close - d.open) || 0.01;
    if (d.close >= d.open && body >= bestBody) {
      bestBody = body;
      bestIdx = i;
    }
    if (d.close < d.open && body >= worstBody) {
      worstBody = body;
      worstIdx = i;
    }
  });

  // AI/平滑处理后可能几乎全是阳K或阴K，回退到按收盘分最高/最低标记
  if (bestIdx < 0) {
    bestIdx = data.reduce((pick, d, i, arr) => (d.close > arr[pick]!.close ? i : pick), 0);
  }
  if (worstIdx < 0) {
    worstIdx = data.reduce((pick, d, i, arr) => (d.close < arr[pick]!.close ? i : pick), 0);
  }
  if (bestIdx === worstIdx && data.length > 1) {
    worstIdx = data.reduce((pick, d, i) => {
      if (i === bestIdx) return pick;
      return d.close < data[pick]!.close ? i : pick;
    }, bestIdx === 0 ? 1 : 0);
  }

  return data.map((d, i) => ({
    ...d,
    isBestYear: i === bestIdx,
    isWorstYear: i === worstIdx,
  }));
}

function buildYearBar(
  info: BirthInfo,
  age: number,
  year: number,
  prevClose: number,
  seed: number,
  rand: () => number,
  bazi: BaziResult | null,
  flags: Partial<KlineData> = {}
): { bar: KlineData; nextClose: number } {
  const liunian = bazi?.liunian.find((l) => l.year === year);
  const baseScore = age === 0 ? 50 : liunian ? ganZhiScore(liunian.ganZhi, seed + age) : 50;
  const volatility = age === 0 ? 2 : 5 + rand() * 12;
  const open = prevClose;
  const close = Math.max(12, Math.min(96, baseScore + (rand() - 0.5) * volatility));
  const high = Math.min(100, Math.max(open, close) + rand() * 6);
  const low = Math.max(5, Math.min(open, close) - rand() * 6);
  return {
    bar: {
      year,
      age,
      open: Math.round(open * 10) / 10,
      close: Math.round(close * 10) / 10,
      high: Math.round(high * 10) / 10,
      low: Math.round(low * 10) / 10,
      score: Math.round(close),
      trend: close >= open ? "up" : "down",
      ganZhi: liunian?.ganZhi,
      ...flags,
    },
    nextClose: close,
  };
}

function advanceCloseToAge(info: BirthInfo, targetAge: number): number {
  const bazi = safeCalculateBazi(info);
  const seed = hashBirth(info);
  const rand = seededRandom(seed);
  let prevClose = 48 + (seed % 15);
  for (let age = 0; age < targetAge; age++) {
    const year = info.year + age;
    const { nextClose } = buildYearBar(info, age, year, prevClose, seed, rand, bazi);
    prevClose = nextClose;
  }
  return prevClose;
}

/** 0–100 岁完整人生 K 线 */
export function generateFullLifeKline(info: BirthInfo): KlineData[] {
  const solarInfo = resolveSolarInfo(info);
  const bazi = safeCalculateBazi(info);
  const seed = hashBirth(info);
  const rand = seededRandom(seed);
  const currentAge = getCurrentAge(solarInfo.year, solarInfo.month, solarInfo.day);
  const data: KlineData[] = [];
  let prevClose = 48 + (seed % 15);

  for (let age = 0; age <= 100; age++) {
    const year = solarInfo.year + age;
    const { bar, nextClose } = buildYearBar(info, age, year, prevClose, seed, rand, bazi, {
      isBirth: age === 0,
      isCurrent: age === currentAge,
      xLabel: age === 0 ? "0\n出生" : age % 10 === 0 ? `${age}` : `${age}`,
    });
    data.push(bar);
    prevClose = nextClose;
  }

  return annotateKlineExtremes(data);
}

/** 从今年起未来 N 年的年 K 线（铺满横轴） */
export function generateForwardYearsKline(info: BirthInfo, count: number): KlineData[] {
  const solarInfo = resolveSolarInfo(info);
  const bazi = safeCalculateBazi(info);
  const seed = hashBirth(info);
  const rand = seededRandom(seed + 9999);
  const currentYear = new Date().getFullYear();
  const currentAge = getCurrentAge(solarInfo.year, solarInfo.month, solarInfo.day);
  let prevClose = advanceCloseToAge(info, currentAge);

  const data: KlineData[] = [];
  for (let i = 0; i < count; i++) {
    const year = currentYear + i;
    const age = year - solarInfo.year;
    const { bar, nextClose } = buildYearBar(info, age, year, prevClose, seed + i, rand, bazi, {
      isCurrent: i === 0,
      xLabel: i === 0 ? `${year}\n今年·${age}岁` : `${year}\n${age}岁`,
    });
    data.push(bar);
    prevClose = nextClose;
  }
  return annotateKlineExtremes(data);
}

/** 年 K 线锚点：月 K 需与之方向一致 */
export interface YearKlineAnchor {
  open: number;
  close: number;
  high: number;
  low: number;
}

function clampKline(v: number, min = 5, max = 96): number {
  return Math.max(min, Math.min(max, v));
}

function roundK(v: number): number {
  return Math.round(v * 10) / 10;
}

/** 将月度 K 线约束到年 K 的开收与高低区间，保证涨跌方向一致 */
export function alignMonthlyKlineToYearBar(
  rows: KlineData[],
  anchor: YearKlineAnchor,
): KlineData[] {
  if (!rows.length) return rows;

  const yearUp = anchor.close >= anchor.open;
  const span = anchor.close - anchor.open || (yearUp ? 2 : -2);
  const result: KlineData[] = [];
  let prevClose = anchor.open;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const month = row.month ?? i + 1;
    const isLast = i === rows.length - 1;
    const targetClose = isLast
      ? anchor.close
      : anchor.open + span * ((i + 1) / rows.length);

    let open = i === 0 ? anchor.open : prevClose;
    let close = targetClose;

    const aiNoise = (row.close - row.open) * 0.25;
    close = clampKline(close + aiNoise, anchor.low, anchor.high);

    if (yearUp && close < open) {
      close = open + Math.max(0.3, Math.abs(span) * 0.015);
    } else if (!yearUp && close > open) {
      close = open - Math.max(0.3, Math.abs(span) * 0.015);
    }

    if (isLast) close = anchor.close;

    const high = clampKline(
      Math.max(open, close, row.high ?? 0, anchor.high * 0.01 + Math.max(open, close)),
      anchor.low,
      anchor.high,
    );
    const low = clampKline(
      Math.min(open, close, row.low ?? 100, anchor.low + Math.min(open, close) * 0.01),
      anchor.low,
      anchor.high,
    );

    result.push({
      ...row,
      month,
      open: roundK(open),
      close: roundK(close),
      high: roundK(Math.max(high, open, close)),
      low: roundK(Math.min(low, open, close)),
      score: Math.round(close),
      trend: close >= open ? "up" : "down",
    });
    prevClose = close;
  }

  if (result[0]) result[0].open = roundK(anchor.open);
  if (result[result.length - 1]) {
    const last = result[result.length - 1]!;
    last.close = roundK(anchor.close);
    last.trend = last.close >= last.open ? "up" : "down";
    last.score = Math.round(last.close);
  }

  return annotateKlineExtremes(result);
}

function resolveYearAnchor(
  info: BirthInfo,
  targetYear: number,
  anchor?: YearKlineAnchor,
): YearKlineAnchor {
  if (anchor) return anchor;
  const currentYear = new Date().getFullYear();
  const count = Math.max(1, targetYear - currentYear + 1);
  const years = generateForwardYearsKline(info, count);
  const bar = years.find((y) => y.year === targetYear);
  if (bar) {
    return { open: bar.open, close: bar.close, high: bar.high, low: bar.low };
  }
  return { open: 50, close: 55, high: 58, low: 47 };
}

/** 某一自然年的 12 个月 K 线（与对应年 K 涨跌方向一致） */
export function generateMonthlyKline(
  info: BirthInfo,
  targetYear: number,
  anchor?: YearKlineAnchor,
): KlineData[] {
  const solarInfo = resolveSolarInfo(info);
  const yearBar = resolveYearAnchor(info, targetYear, anchor);
  const seed = hashBirth(info) + targetYear * 100;
  const rand = seededRandom(seed);
  const age = targetYear - solarInfo.year;
  const now = new Date();
  const isThisYear = targetYear === now.getFullYear();
  const yearUp = yearBar.close >= yearBar.open;
  const span = yearBar.close - yearBar.open;
  const data: KlineData[] = [];
  let prevClose = yearBar.open;

  for (let m = 1; m <= 12; m++) {
    const open = m === 1 ? yearBar.open : prevClose;
    const progress = m / 12;
    const idealClose = yearBar.open + span * progress;
    const noise = (rand() - 0.5) * Math.max(4, Math.abs(span) * 0.35);
    let close = idealClose + noise;

    if (yearUp && close < open) close = open + rand() * 2 + 0.2;
    if (!yearUp && close > open) close = open - rand() * 2 - 0.2;
    if (m === 12) close = yearBar.close;

    close = clampKline(close, yearBar.low, yearBar.high);
    const high = clampKline(Math.max(open, close) + rand() * 3, yearBar.low, yearBar.high);
    const low = clampKline(Math.min(open, close) - rand() * 3, yearBar.low, yearBar.high);
    const isCurrentMonth = isThisYear && m === now.getMonth() + 1;

    data.push({
      year: targetYear,
      age,
      month: m,
      open: roundK(open),
      close: roundK(close),
      high: roundK(high),
      low: roundK(low),
      score: Math.round(close),
      trend: close >= open ? "up" : "down",
      isMonthly: true,
      isBirth: false,
      isCurrent: isCurrentMonth,
      xLabel: m === 1
        ? `1月\n${targetYear}·${age}岁`
        : isCurrentMonth
          ? `${m}月\n今`
          : `${m}月`,
    });
    prevClose = close;
  }

  return annotateKlineExtremes(data);
}

/** 从完整 0–100 岁 K 线截取「当前年起未来 N 年」并清除全局极值标记（由图表层重新标注） */
export function sliceForwardPeriodFromFull(
  fullKline: KlineData[],
  lifeYears: number,
): KlineData[] {
  const currentYear = new Date().getFullYear();
  const endYear = currentYear + lifeYears - 1;
  return fullKline
    .filter((row) => row.year >= currentYear && row.year <= endYear)
    .map((row, idx) => {
      const { isBestYear: _b, isWorstYear: _w, ...rest } = row;
      return { ...rest, isCurrent: idx === 0 };
    });
}

/** 按推演年数生成主图表数据 */
export function generatePeriodKline(info: BirthInfo, lifeYears: number): KlineData[] {
  if (lifeYears === 1) {
    return generateMonthlyKline(info, new Date().getFullYear());
  }
  if (lifeYears >= 100) {
    return generateFullLifeKline(info);
  }
  return generateForwardYearsKline(info, lifeYears);
}

/** @deprecated use generatePeriodKline / generateFullLifeKline */
export function generateLifeKline(info: BirthInfo, lifeYears = 80): KlineData[] {
  return generatePeriodKline(info, lifeYears);
}

export function getFortuneLevel(score: number): { label: string; color: string } {
  if (score >= 75) return { label: "运势上升", color: "#ef4444" };
  if (score >= 55) return { label: "平稳向好", color: "#f97316" };
  if (score >= 40) return { label: "调整期", color: "#eab308" };
  return { label: "宜守不宜攻", color: "#22c55e" };
}

const YEAR_TEMPLATES = [
  "本年度整体运势{level}，{aspect}方面表现突出。",
  "流年{ganZhi}入命，{aspect}运势值得关注，宜把握机遇。",
  "此年{level}，建议在{aspect}领域积极布局。",
];

const ASPECTS = ["事业", "财运", "感情", "健康", "人际"];

export function generateYearAnalysis(item: KlineData): import("./types").YearAnalysis {
  const level = getFortuneLevel(item.score);
  const aspect = ASPECTS[item.age % ASPECTS.length];
  const tpl = YEAR_TEMPLATES[item.age % YEAR_TEMPLATES.length];
  const summary = tpl
    .replace("{level}", level.label)
    .replace("{aspect}", aspect)
    .replace("{ganZhi}", item.ganZhi ?? "");

  const highlights = [
    item.trend === "up" ? "命势呈上升趋势，宜进取" : "命势调整期，宜稳守",
    `${aspect}运势${item.score >= 60 ? "较旺" : "一般"}`,
    item.age % 12 === 0 ? "本命年前后需多加留意" : "适合学习新技能",
  ];

  return {
    year: item.year,
    age: item.age,
    score: item.score,
    summary,
    highlights,
    luck: item.close >= item.open ? "吉" : "凶",
  };
}

const DIMENSIONS = [
  { key: "overall", label: "整体命势" },
  { key: "career", label: "事业" },
  { key: "wealth", label: "财运" },
  { key: "marriage", label: "婚姻" },
  { key: "noble", label: "贵人" },
  { key: "health", label: "健康" },
  { key: "safety", label: "平安" },
  { key: "family", label: "六亲" },
  { key: "love", label: "桃花" },
  { key: "personality", label: "性格" },
  { key: "fengshui", label: "风水" },
];

export function generateOverallAnalysis(kline: KlineData[], info: BirthInfo): import("./types").OverallAnalysis {
  const seed = hashBirth(info);
  const avg = Math.round(kline.reduce((s, d) => s + d.score, 0) / kline.length);
  const peak = kline.reduce((a, b) => (a.score > b.score ? a : b));
  const current = kline.find((k) => k.isCurrent);

  const summary = `您的人生K线整体均势 ${avg} 分，命势峰值出现在 ${peak.age} 岁（${peak.year}年）。${
    current ? `当前 ${current.age} 岁，运势指数 ${current.score}，${getFortuneLevel(current.score).label}。` : ""
  }红K代表运势上扬之年，绿K代表调整沉淀之年，宜顺势而为。`;

  const dimensions = DIMENSIONS.map((d, i) => {
    const score = Math.max(20, Math.min(95, avg + ((seed + i * 7) % 25) - 12));
    const texts: Record<string, string> = {
      overall: `人生整体走势${score >= 60 ? "向上" : "平稳"}，中年后渐入佳境。`,
      career: score >= 65 ? "事业黄金期将至，宜把握机遇。" : "事业稳步发展，深耕专业。",
      wealth: score >= 65 ? "财运亨通，正财偏财皆有收获。" : "财运平稳，宜稳健理财。",
      marriage: score >= 60 ? "婚姻感情较为和谐，宜真诚沟通。" : "感情宜慢热，以稳为主。",
      noble: "贵人运在西北，广结善缘。",
      health: score >= 55 ? "体质尚可，注意作息规律。" : "需加强锻炼，定期体检。",
      safety: "整体平安，出行注意南方方位。",
      family: "六亲关系总体和睦，宜多陪伴家人。",
      love: score >= 60 ? "桃花运势较旺，感情生活丰富。" : "桃花宜随缘，不宜强求。",
      personality: "性格沉稳内敛，处事有条理，宜扬长避短。",
      fengshui: "居家宜明亮通风，床头朝东南可助运势。",
    };
    return { ...d, score, text: texts[d.key] ?? "运势平稳。" };
  });

  return { summary, dimensions };
}

export const EMPTY_DIMENSIONS = DIMENSIONS.map((d) => ({
  ...d,
  text: "填写生辰并排盘测算后显示",
}));

export function generateIntradayData(info: BirthInfo, year: number) {
  const seed = hashBirth(info) + year;
  const rand = seededRandom(seed);
  const months = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
  let prevClose = 40 + (seed % 30);
  return months.map((label, i) => {
    const open = prevClose;
    const close = Math.max(15, Math.min(95, open + (rand() - 0.5) * 20));
    prevClose = close;
    return {
      month: i + 1, label, score: Math.round(close),
      open: Math.round(open * 10) / 10,
      close: Math.round(close * 10) / 10,
      high: Math.round(Math.min(100, Math.max(open, close) + rand() * 6) * 10) / 10,
      low: Math.round(Math.max(5, Math.min(open, close) - rand() * 6) * 10) / 10,
    };
  });
}

export function generateKlineData(info: BirthInfo, years: number): KlineData[] {
  return generateForwardYearsKline(info, years);
}

/** 本地快速生成人生 K 线（无 AI 调用，毫秒级） */
export function generateLifeKlineBundle(
  info: BirthInfo,
  years: number,
  includeWholeLife = true,
): { periodKline: KlineData[]; fullKline: KlineData[]; overall: OverallAnalysis } {
  const requestYears = Math.max(1, Math.min(100, years || 10));
  const periodKline = annotateKlineExtremes(generateForwardYearsKline(info, requestYears));
  const fullKline = annotateKlineExtremes(
    includeWholeLife ? generateFullLifeKline(info) : periodKline,
  );
  const overall = generateOverallAnalysis(fullKline, info);
  return { periodKline, fullKline, overall };
}
