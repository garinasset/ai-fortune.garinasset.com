import type { BaziResult, BirthInfo } from "./types";
import { formatBaziPrompt } from "./bazi";

const STORAGE_KEY = "ai-fortune-measurement-context";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface FortuneMeasurementContext {
  birthInfo?: BirthInfo;
  bazi?: BaziResult;
  baziSummary?: string;
  lifeklineSummary?: string;
  updatedAt: number;
}

interface StoredEntry {
  data: FortuneMeasurementContext;
}

function readStore(): FortuneMeasurementContext | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw) as StoredEntry;
    if (Date.now() - entry.data.updatedAt > TTL_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

function writeStore(partial: Partial<FortuneMeasurementContext>): FortuneMeasurementContext {
  const prev = readStore() ?? { updatedAt: Date.now() };
  const next: FortuneMeasurementContext = {
    ...prev,
    ...partial,
    updatedAt: Date.now(),
  };
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ data: next }));
    } catch {
      /* quota */
    }
  }
  return next;
}

export function saveBaziMeasurement(birthInfo: BirthInfo, bazi: BaziResult, summary?: string): void {
  writeStore({ birthInfo, bazi, baziSummary: summary });
}

export function saveLifeklineMeasurement(
  birthInfo: BirthInfo,
  bazi: BaziResult | null | undefined,
  summary?: string,
): void {
  writeStore({
    birthInfo,
    ...(bazi ? { bazi } : {}),
    lifeklineSummary: summary,
  });
}

export function loadFortuneMeasurementContext(): FortuneMeasurementContext | null {
  return readStore();
}

/** 供 API / LLM 使用的测算上下文文本 */
export function formatFortuneContextForPrompt(ctx: FortuneMeasurementContext | null | undefined): string {
  if (!ctx) return "";
  const parts: string[] = [];

  if (ctx.bazi) {
    parts.push(formatBaziPrompt(ctx.bazi));
    parts.push(
      "【重要】以上八字排盘为站内已完成的权威测算结果。回答时必须以其中的日主、五行、四柱为准，不可与排盘结论矛盾。",
    );
  }
  if (ctx.baziSummary?.trim()) {
    parts.push(`八字分析摘要：${ctx.baziSummary.trim()}`);
  }
  if (ctx.lifeklineSummary?.trim()) {
    parts.push(`人生K线摘要：${ctx.lifeklineSummary.trim()}`);
  }

  return parts.join("\n\n").trim();
}
