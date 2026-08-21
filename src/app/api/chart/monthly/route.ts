import { NextRequest, NextResponse } from "next/server";
import { generateMonthlyKlineWithAI, isAIJsonParseError } from "@/lib/llm";
import { getServerLLMConfig } from "@/lib/server-config";
import { calculateBazi, formatBaziPrompt } from "@/lib/bazi";
import { annotateKlineExtremes } from "@/lib/fortune-chart";
import type { BirthInfo } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { birthInfo, year } = (await req.json()) as {
      birthInfo: BirthInfo;
      year: number;
    };

    if (!birthInfo?.year || !year) {
      return NextResponse.json({ error: "缺少参数" }, { status: 400 });
    }

    let baziText: string | undefined;
    try {
      const bazi = calculateBazi(birthInfo);
      baziText = formatBaziPrompt(bazi);
    } catch {
      baziText = undefined;
    }

    const kline = await generateMonthlyKlineWithAI(getServerLLMConfig(), {
      birthInfo,
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
