import { NextRequest, NextResponse } from "next/server";
import { generateLifeKlineWithAI, isAIJsonParseError } from "@/lib/llm";
import { getServerLLMConfig } from "@/lib/server-config";
import { calculateBazi, formatBaziPrompt } from "@/lib/bazi";
import { normalizeBirthInfo } from "@/lib/birth-utils";
import type { BirthInfo } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { birthInfo, years } = (await req.json()) as {
      birthInfo: BirthInfo;
      years: number;
    };

    if (!birthInfo?.year || !birthInfo?.month || !birthInfo?.day) {
      return NextResponse.json({ error: "请填写完整的出生信息" }, { status: 400 });
    }

    let normalizedBirthInfo: BirthInfo;
    try {
      normalizedBirthInfo = normalizeBirthInfo(birthInfo);
    } catch {
      return NextResponse.json({ error: "出生信息格式无效" }, { status: 400 });
    }

    const normalizedYears = Math.max(1, Math.min(100, Number(years) || 10));

    let baziText: string | undefined;
    try {
      const bazi = calculateBazi(normalizedBirthInfo);
      baziText = formatBaziPrompt(bazi);
    } catch {
      baziText = undefined;
    }

    const data = await generateLifeKlineWithAI(getServerLLMConfig(), {
      birthInfo: normalizedBirthInfo,
      years: normalizedYears,
      includeWholeLife: true,
      baziText,
    });

    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "服务器错误";
    if (isAIJsonParseError(e) && process.env.NODE_ENV !== "production") {
      return NextResponse.json({ error: message, debug: e.debug }, { status: 500 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
