import { NextRequest, NextResponse } from "next/server";
import type { BirthInfo } from "@/lib/types";
import { generateMonthlyKlineWithAI } from "@/lib/llm";
import { getServerLLMConfig } from "@/lib/server-config";
import { calculateBazi, formatBaziPrompt } from "@/lib/bazi";

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

    const intraday = kline.map((item) => ({
      month: item.month,
      label: `${item.month}月`,
      score: item.score,
      open: item.open,
      close: item.close,
      high: item.high,
      low: item.low,
    }));

    return NextResponse.json({ intraday });
  } catch (e) {
    const message = e instanceof Error ? e.message : "服务器错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
