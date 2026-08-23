import { NextRequest, NextResponse } from "next/server";
import { calculateBazi, formatBaziPrompt } from "@/lib/bazi";
import { normalizeBirthInfo } from "@/lib/birth-utils";
import { annotateKlineExtremes, generateMonthlyKline } from "@/lib/fortune-chart";
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

    let normalized: BirthInfo;
    try {
      normalized = normalizeBirthInfo(birthInfo);
    } catch {
      return NextResponse.json({ error: "出生信息格式无效" }, { status: 400 });
    }

    try {
      calculateBazi(normalized);
    } catch (e) {
      const message = e instanceof Error ? e.message : "出生信息无效";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const kline = annotateKlineExtremes(generateMonthlyKline(normalized, year));

    return NextResponse.json({ kline });
  } catch (e) {
    const message = e instanceof Error ? e.message : "服务器错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
