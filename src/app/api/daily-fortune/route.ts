import { NextRequest, NextResponse } from "next/server";
import { generateDailyFortuneWithAI } from "@/lib/llm";
import { getServerLLMConfig } from "@/lib/server-config";
import { calculateBazi, formatBaziPrompt } from "@/lib/bazi";
import { normalizeBirthInfo } from "@/lib/birth-utils";
import type { BirthInfo } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { birthInfo, date } = (await req.json()) as {
      birthInfo: BirthInfo;
      date?: string;
    };

    if (!birthInfo?.year || !birthInfo?.month || !birthInfo?.day) {
      return NextResponse.json({ error: "请提供完整的出生信息" }, { status: 400 });
    }

    let normalized: BirthInfo;
    try {
      normalized = normalizeBirthInfo(birthInfo);
    } catch {
      return NextResponse.json({ error: "出生信息格式无效" }, { status: 400 });
    }

    const today = date ?? new Date().toISOString().slice(0, 10);

    let baziText: string | undefined;
    try {
      baziText = formatBaziPrompt(calculateBazi(normalized));
    } catch {
      baziText = undefined;
    }

    const guide = await generateDailyFortuneWithAI(getServerLLMConfig(), {
      birthInfo: normalized,
      baziText,
      date: today,
    });

    return NextResponse.json({ guide, mock: false });
  } catch (e) {
    const message = e instanceof Error ? e.message : "服务器错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
