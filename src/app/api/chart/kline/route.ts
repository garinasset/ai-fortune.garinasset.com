import { NextRequest, NextResponse } from "next/server";
import type { BirthInfo, ChartPeriod } from "@/lib/types";
import { generateLifeKlineWithAI, isAIJsonParseError } from "@/lib/llm";
import { getServerLLMConfig } from "@/lib/server-config";
import { calculateBazi, formatBaziPrompt } from "@/lib/bazi";

export async function POST(req: NextRequest) {
  try {
    const { birthInfo, years } = (await req.json()) as {
      birthInfo: BirthInfo;
      years: ChartPeriod;
    };

    if (!birthInfo?.year) {
      return NextResponse.json({ error: "缺少出生信息" }, { status: 400 });
    }

    let baziText: string | undefined;
    try {
      const bazi = calculateBazi(birthInfo);
      baziText = formatBaziPrompt(bazi);
    } catch {
      baziText = undefined;
    }

    const data = await generateLifeKlineWithAI(getServerLLMConfig(), {
      birthInfo,
      years: years ?? 10,
      includeWholeLife: false,
      baziText,
    });

    return NextResponse.json({ kline: data.periodKline });
  } catch (e) {
    const message = e instanceof Error ? e.message : "服务器错误";
    if (isAIJsonParseError(e) && process.env.NODE_ENV !== "production") {
      return NextResponse.json({ error: message, debug: e.debug }, { status: 500 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
