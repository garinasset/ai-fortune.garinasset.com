/** 将 AI 文本拆成段落（优先按句号分句，再按空行分段） */
export function splitAnalysisParagraphs(text: string): string[] {
  if (!text?.trim()) return [];
  const normalized = text.replace(/\r\n/g, "\n").trim();

  const blocks = normalized.split(/\n\s*\n+/).map((p) => p.trim()).filter(Boolean);
  const chunks = blocks.length > 0 ? blocks : [normalized];

  const sentences: string[] = [];
  for (const chunk of chunks) {
    const parts = chunk
      .split(/(?<=[。！？；])+/u)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length > 0) sentences.push(...parts);
    else sentences.push(chunk);
  }

  return sentences;
}

export function truncateParagraphs(paragraphs: string[], maxParagraphs: number): string[] {
  if (paragraphs.length <= maxParagraphs) return paragraphs;
  return paragraphs.slice(0, maxParagraphs);
}

export type AnalysisSegment =
  | { type: "lead"; text: string }
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bullets"; items: string[] }
  | { type: "tip"; text: string };

const BULLET_LINE = /^[\s]*[·•\-*]\s+/;

function parseParagraphSegments(paragraph: string, isFirst: boolean): AnalysisSegment[] {
  const trimmed = paragraph.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("💡")) {
    return [{ type: "tip", text: trimmed.replace(/^💡\s*/, "") }];
  }

  const headingMatch = trimmed.match(/^【([^】]+)】\s*([\s\S]*)$/);
  if (headingMatch) {
    const segments: AnalysisSegment[] = [{ type: "heading", text: headingMatch[1] }];
    const rest = headingMatch[2]?.trim();
    if (rest) segments.push(...parseParagraphSegments(rest, false));
    return segments;
  }

  const lines = trimmed.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length > 1 && lines.every((l) => BULLET_LINE.test(l) || l.startsWith("·"))) {
    return [{
      type: "bullets",
      items: lines.map((l) => l.replace(BULLET_LINE, "").replace(/^·\s*/, "")),
    }];
  }

  if (isFirst) {
    return [{ type: "lead", text: trimmed }];
  }

  return [{ type: "paragraph", text: trimmed }];
}

/** 将解读文本解析为可渲染的结构块 */
export function parseAnalysisSegments(text: string): AnalysisSegment[] {
  const paragraphs = splitAnalysisParagraphs(text);
  return paragraphs.flatMap((p, i) => parseParagraphSegments(p, i === 0));
}

/** 复制到剪贴板用的纯文本 */
export function formatAnalysisForCopy(text: string): string {
  return text.replace(/\r\n/g, "\n").trim();
}
