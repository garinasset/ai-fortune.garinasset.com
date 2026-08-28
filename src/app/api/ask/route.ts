import { NextRequest, NextResponse } from "next/server";
import { askSpiritPet } from "@/lib/llm";
import { getServerLLMConfig } from "@/lib/server-config";
import type { BirthInfo } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { question, birthInfo, petName, petEmoji, personName, measurementContext } = (await req.json()) as {
      question: string;
      birthInfo?: BirthInfo;
      petName?: string;
      petEmoji?: string;
      personName?: string;
      measurementContext?: string;
    };

    if (!question?.trim()) {
      return NextResponse.json({ error: "请输入问题" }, { status: 400 });
    }

    const { answer, mock } = await askSpiritPet(getServerLLMConfig(), {
      question,
      birthInfo,
      petName,
      petEmoji,
      personName,
      measurementContext,
    });

    return NextResponse.json({ answer, mock });
  } catch (e) {
    const message = e instanceof Error ? e.message : "服务器错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
