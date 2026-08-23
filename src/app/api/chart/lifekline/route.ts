import { NextRequest, NextResponse } from "next/server";
import { generateLifeKlineWithAI, isAIJsonParseError } from "@/lib/llm";
import { getServerLLMConfig } from "@/lib/server-config";
import { calculateBazi, formatBaziPrompt } from "@/lib/bazi";
import { normalizeBirthInfo } from "@/lib/birth-utils";
import { annotateKlineExtremes } from "@/lib/fortune-chart";
import type { BirthInfo } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { birthInfo, years, includeWholeLife, scope } = (await req.json()) as {
      birthInfo: BirthInfo;
      years: number;
      includeWholeLife?: boolean;
      /** period=推演年段；fullLife=AI 0-100 岁全览 */
      scope?: "period" | "fullLife";
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
    const fullLifeOnly = scope === "fullLife";

    let baziText: string | undefined;
    try {
      const bazi = calculateBazi(normalizedBirthInfo);
      baziText = formatBaziPrompt(bazi);
    } catch (e) {
      const message = e instanceof Error ? e.message : "出生信息无效";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const data = await generateLifeKlineWithAI(getServerLLMConfig(), {
      birthInfo: normalizedBirthInfo,
      years: normalizedYears,
      includeWholeLife: fullLifeOnly ? true : (includeWholeLife ?? false),
      fullLifeOnly,
      baziText,
    });

    if (fullLifeOnly) {
      return NextResponse.json({
        fullKline: annotateKlineExtremes(data.fullKline),
        overall: data.overall,
      });
    }

    return NextResponse.json({
      ...data,
      periodKline: annotateKlineExtremes(data.periodKline),
      fullKline: annotateKlineExtremes(data.fullKline),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "服务器错误";
    if (isAIJsonParseError(e) && process.env.NODE_ENV !== "production") {
      return NextResponse.json({ error: message, debug: e.debug }, { status: 500 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
