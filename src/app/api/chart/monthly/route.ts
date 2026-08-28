import { NextRequest, NextResponse } from "next/server";
import { generateMonthlyKlineWithAI, isAIJsonParseError } from "@/lib/llm";
import { getServerLLMConfig } from "@/lib/server-config";
import { calculateBazi, formatBaziPrompt } from "@/lib/bazi";
import { normalizeBirthInfo } from "@/lib/birth-utils";
import { annotateKlineExtremes, generateMonthlyKline, normalizeYearAnchor } from "@/lib/fortune-chart";
import type { BirthInfo } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { birthInfo, year, yearAnchor } = (await req.json()) as {
      birthInfo: BirthInfo;
      year: number;
      yearAnchor?: { open: number; close: number; high: number; low: number };
    };

    if (!birthInfo?.year || !year) {
      return NextResponse.json({ error: "缺少参数" }, { status: 400 });
    }

    let normalized: BirthInfo;
    try {
      normalized = normalizeBirthInfo(birthInfo);
    } catch {
      return NextResponse.json({ error: "出生信息格式无效" }, { status: 400 });
    }

    let baziText: string | undefined;
    try {
      const bazi = calculateBazi(normalized);
      baziText = formatBaziPrompt(bazi);
    } catch (e) {
      const message = e instanceof Error ? e.message : "出生信息无效";
      return NextResponse.json({ error: message }, { status: 500 });
    }

    if (yearAnchor) {
      const kline = await generateMonthlyKlineWithAI(getServerLLMConfig(), {
        birthInfo: normalized,
        year,
        baziText,
        yearAnchor: normalizeYearAnchor(yearAnchor),
      });
      return NextResponse.json({ kline: annotateKlineExtremes(kline) });
    }

    const kline = await generateMonthlyKlineWithAI(getServerLLMConfig(), {
      birthInfo: normalized,
      year,
      baziText,
    });

    return NextResponse.json({ kline: annotateKlineExtremes(kline) });
  } catch (e) {
    const message = e instanceof Error ? e.message : "服务器错误";
    if (isAIJsonParseError(e) && process.env.NODE_ENV !== "production") {
      return NextResponse.json({ error: message, debug: e.debug }, { status: 500 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
