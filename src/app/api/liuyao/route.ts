import { NextRequest, NextResponse } from "next/server";
import { analyzeLiuyaoWithAI } from "@/lib/llm";
import { getServerLLMConfig } from "@/lib/server-config";
import { calculateBazi } from "@/lib/bazi";
import { normalizeBirthInfo, isValidBirthInfo } from "@/lib/birth-utils";
import type { BirthInfo } from "@/lib/types";
import type { YaoLine } from "@/lib/liuyao";

function formatLines(lines: YaoLine[]): string {
  return lines
    .map((line, idx) => `第${idx + 1}爻：${line.label}（${line.isYang ? "阳" : "阴"}${line.isChanging ? "，动爻" : "，静爻"}）`)
    .join("；");
}

export async function POST(req: NextRequest) {
  try {
    const { question, guaName, guaDesc, lines, birthInfo: rawBirthInfo } = (await req.json()) as {
      question: string;
      guaName: string;
      guaDesc: string;
      lines: YaoLine[];
      birthInfo?: BirthInfo;
    };

    if (!question?.trim() || !guaName || !guaDesc || !Array.isArray(lines) || lines.length !== 6) {
      return NextResponse.json({ error: "参数不完整" }, { status: 400 });
    }

    if (!rawBirthInfo || !isValidBirthInfo(rawBirthInfo)) {
      return NextResponse.json({ error: "请提供完整生辰信息" }, { status: 400 });
    }

    const birthInfo = normalizeBirthInfo(rawBirthInfo);
    let baziText: string | undefined;
    try {
      const bazi = calculateBazi(birthInfo);
      baziText = `${bazi.bazi.year} ${bazi.bazi.month} ${bazi.bazi.day} ${bazi.bazi.hour} · ${bazi.dayMaster}`;
    } catch {
      baziText = undefined;
    }

    const result = await analyzeLiuyaoWithAI(getServerLLMConfig(), {
      question,
      guaName,
      guaDesc,
      linesText: formatLines(lines),
      birthInfo,
      baziText,
    });

    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "服务器错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
