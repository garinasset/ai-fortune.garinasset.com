import { NextRequest, NextResponse } from "next/server";
import { analyzeLiuyaoWithAI } from "@/lib/llm";
import { getServerLLMConfig } from "@/lib/server-config";
import type { YaoLine } from "@/lib/liuyao";

function formatLines(lines: YaoLine[]): string {
  return lines
    .map((line, idx) => `第${idx + 1}爻：${line.label}（${line.isYang ? "阳" : "阴"}${line.isChanging ? "，动爻" : "，静爻"}）`)
    .join("；");
}

export async function POST(req: NextRequest) {
  try {
    const { question, guaName, guaDesc, lines } = (await req.json()) as {
      question: string;
      guaName: string;
      guaDesc: string;
      lines: YaoLine[];
    };

    if (!question?.trim() || !guaName || !guaDesc || !Array.isArray(lines) || lines.length !== 6) {
      return NextResponse.json({ error: "参数不完整" }, { status: 400 });
    }

    const result = await analyzeLiuyaoWithAI(getServerLLMConfig(), {
      question,
      guaName,
      guaDesc,
      linesText: formatLines(lines),
    });

    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "服务器错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
