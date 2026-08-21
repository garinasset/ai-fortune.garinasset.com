import type { AnalysisResult } from "./types";

/** 客户端看相分析：统一走服务端 AI */
export async function analyzeXiangImage(
  type: "palm" | "face",
  image: string,
): Promise<{ analysis: AnalysisResult; fromMock: boolean }> {
  const res = await fetch("/api/analyze/image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, image }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "分析失败");
  if (!data.analysis?.summary) throw new Error("返回数据不完整");
  return { analysis: data.analysis as AnalysisResult, fromMock: !!data.mock };
}
