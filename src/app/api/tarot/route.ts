import { NextRequest, NextResponse } from "next/server";
import { analyzeTarotWithAI } from "@/lib/llm";
import { getServerLLMConfig } from "@/lib/server-config";
import { formatCardForAI } from "@/lib/tarot";
import type { DrawnTarotCard, TarotCardMeta } from "@/lib/tarot/types";

type ApiCard = {
  card: TarotCardMeta;
  reversed: boolean;
  position: string;
  positionLabel: string;
};

export async function POST(req: NextRequest) {
  try {
    const { question, cards } = (await req.json()) as {
      question: string;
      cards: ApiCard[];
    };

    if (!question?.trim() || !Array.isArray(cards) || cards.length !== 3) {
      return NextResponse.json({ error: "参数不完整" }, { status: 400 });
    }

    const spreadText = [
      `问题：${question.trim()}`,
      "牌阵：三牌阵 · 过去 / 现在 / 未来",
      ...cards.map((c) => formatCardForAI(c as DrawnTarotCard)),
    ].join("\n");

    const result = await analyzeTarotWithAI(getServerLLMConfig(), {
      question: question.trim(),
      spreadText,
    });

    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "服务器错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
