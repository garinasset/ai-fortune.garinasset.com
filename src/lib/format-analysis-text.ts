/** 将 AI 文本拆成段落（支持 \\n\\n 或单换行） */
export function splitAnalysisParagraphs(text: string): string[] {
  if (!text?.trim()) return [];
  const normalized = text.replace(/\r\n/g, "\n").trim();
  const byDouble = normalized.split(/\n\s*\n+/).map((p) => p.trim()).filter(Boolean);
  if (byDouble.length > 1) return byDouble;
  return normalized.split(/\n+/).map((p) => p.trim()).filter(Boolean);
}

export function truncateParagraphs(paragraphs: string[], maxParagraphs: number): string[] {
  if (paragraphs.length <= maxParagraphs) return paragraphs;
  return paragraphs.slice(0, maxParagraphs);
}
