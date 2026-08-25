import { NextRequest, NextResponse } from "next/server";
import { calculateBazi, formatBaziPrompt, getLiuyueGanZhi } from "@/lib/bazi";
import { normalizeBirthInfo } from "@/lib/birth-utils";
import { analyzeBaziFlow } from "@/lib/llm";
import { getServerLLMConfig } from "@/lib/server-config";
import type { BirthInfo } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { birthInfo, scope, year, month } = (await req.json()) as {
      birthInfo: BirthInfo;
      scope: "liunian" | "liuyue";
      year: number;
      month?: number;
    };

    if (!birthInfo?.year || !birthInfo?.month || !birthInfo?.day) {
      return NextResponse.json({ error: "请填写完整的出生信息" }, { status: 400 });
    }
    if (scope !== "liunian" && scope !== "liuyue") {
      return NextResponse.json({ error: "无效的分析类型" }, { status: 400 });
    }

    let normalizedBirthInfo: BirthInfo;
    try {
      normalizedBirthInfo = normalizeBirthInfo(birthInfo);
    } catch {
      return NextResponse.json({ error: "出生信息格式无效" }, { status: 400 });
    }

    const targetYear = Number(year);
    if (!Number.isFinite(targetYear) || targetYear < 1900 || targetYear > 2100) {
      return NextResponse.json({ error: "年份无效" }, { status: 400 });
    }

    const bazi = calculateBazi(normalizedBirthInfo);
    const baziText = formatBaziPrompt(bazi);

    if (scope === "liunian") {
      const liunian = bazi.liunian.find((l) => l.year === targetYear);
      if (!liunian) {
        return NextResponse.json({ error: "未找到该流年数据" }, { status: 400 });
      }
      const data = await analyzeBaziFlow(getServerLLMConfig(), {
        scope: "liunian",
        baziText,
        year: liunian.year,
        ganZhi: liunian.ganZhi,
        dayun: liunian.dayun,
        age: liunian.age,
      });
      return NextResponse.json({
        scope,
        year: liunian.year,
        ganZhi: liunian.ganZhi,
        age: liunian.age,
        dayun: liunian.dayun,
        analysis: data.analysis,
        mock: data.mock,
      });
    }

    const targetMonth = Number(month);
    if (!Number.isFinite(targetMonth) || targetMonth < 1 || targetMonth > 12) {
      return NextResponse.json({ error: "月份无效" }, { status: 400 });
    }
    const ganZhi = getLiuyueGanZhi(targetYear, targetMonth);
    const data = await analyzeBaziFlow(getServerLLMConfig(), {
      scope: "liuyue",
      baziText,
      year: targetYear,
      month: targetMonth,
      ganZhi,
    });
    return NextResponse.json({
      scope,
      year: targetYear,
      month: targetMonth,
      ganZhi,
      analysis: data.analysis,
      mock: data.mock,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "服务器错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
