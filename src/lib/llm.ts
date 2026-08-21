import type { AnalysisResult, LLMConfig, BaziResult, BirthInfo, KlineData, OverallAnalysis } from "./types";
import {
  getMockBaziAnalysis,
  getMockImageAnalysis,
  simulateAnalysisDelay,
  MOCK_MODE,
} from "./mock-analysis";

const DEFAULT_MODELS: Record<string, { baseUrl: string; model: string }> = {
  deepseek: {
    baseUrl: "https://api.deepseek.com/v1",
    model: "deepseek-chat",
  },
  openai: {
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
  },
};

export { MOCK_MODE };

interface LiuyaoAiResult {
  analysis: string;
  advice: string;
  luck: "大吉" | "吉" | "平" | "凶" | "大凶";
}

interface LifeKlineAiResult {
  summary: string;
  kline: Array<{
    year: number;
    age: number;
    open: number;
    close: number;
    high: number;
    low: number;
    ganZhi?: string;
  }>;
  dimensions: Array<{
    key: string;
    label: string;
    score: number;
    text: string;
  }>;
}

interface MonthlyKlineAiResult {
  kline: Array<{
    month: number;
    open: number;
    close: number;
    high: number;
    low: number;
  }>;
}

export interface AIJsonDebugInfo {
  provider: string;
  model: string;
  parseError: string;
  rawPreview: string;
  jsonPreview: string;
  errorPosition?: number;
  aroundError?: string;
}

export class AIJsonParseError extends Error {
  debug: AIJsonDebugInfo;

  constructor(message: string, debug: AIJsonDebugInfo) {
    super(message);
    this.name = "AIJsonParseError";
    this.debug = debug;
  }
}

export function isAIJsonParseError(err: unknown): err is AIJsonParseError {
  return err instanceof AIJsonParseError;
}

function buildSystemPrompt(type: "bazi" | "palm" | "face"): string {
  const typeLabel = { bazi: "八字命理", palm: "手相", face: "面相" }[type];
  const mayiNote =
    type === "face" || type === "palm"
      ? "分析请参考中国古代《麻衣神相》体系，结合十二宫、三停五岳、五官六府等经典相法术语，"
      : "";
  return `你是一位精通中国传统命理学与《麻衣神相》的资深相师，擅长${typeLabel}分析。
${mayiNote}请根据用户提供的信息，给出专业、详尽且积极正面的命理分析。

必须严格以 JSON（json）格式返回，不要包含任何 markdown 代码块或其他文字：
{
  "summary": "200字以内的总体概述",
  "categories": {
    "wealth": "财运分析，80-150字",
    "love": "爱情分析，80-150字",
    "personality": "性格分析，80-150字",
    "friends": "朋友人际分析，80-150字",
    "children": "子女分析，80-150字",
    "family": "家庭分析，80-150字",
    "career": "事业分析，80-150字"
  }
}

注意：分析要有命理依据，语言通俗易懂，给出具体建议。`;
}

function parseAnalysisResponse(content: string): AnalysisResult {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI 返回格式无效");

  const parsed = JSON.parse(jsonMatch[0]) as AnalysisResult;
  if (!parsed.summary || !parsed.categories) {
    throw new Error("AI 返回内容不完整");
  }
  return parsed;
}

export function isMockMode(config?: LLMConfig): boolean {
  return MOCK_MODE;
}

export async function analyzeBazi(
  config: LLMConfig | undefined,
  bazi: BaziResult,
  baziText: string
): Promise<{ analysis: AnalysisResult; mock: boolean }> {
  if (!config?.apiKey) {
    throw new Error("未配置 AI API Key，请在服务端环境变量设置 DEEPSEEK_API_KEY");
  }
  if (isMockMode(config)) {
    await simulateAnalysisDelay();
    return { analysis: getMockBaziAnalysis(bazi), mock: true };
  }

  const analysis = await analyzeWithLLM(config!, "bazi", buildBaziPrompt(baziText));
  return { analysis, mock: false };
}

export async function analyzeImage(
  config: LLMConfig | undefined,
  type: "palm" | "face",
  imageBase64: string,
  description: string
): Promise<{ analysis: AnalysisResult; mock: boolean }> {
  if (!config?.apiKey) {
    throw new Error("未配置 AI API Key，请在服务端环境变量设置 DEEPSEEK_API_KEY");
  }
  if (isMockMode(config)) {
    await simulateAnalysisDelay();
    return {
      analysis: getMockImageAnalysis(type, imageBase64.slice(-200)),
      mock: true,
    };
  }

  let prompt = buildImagePrompt(type, description);

  if (config?.provider === "openai") {
    const visionResult = await analyzeImageWithVision(config, type, imageBase64);
    if (visionResult) {
      prompt = buildImagePrompt(type, visionResult);
    }
  }

  const analysis = await analyzeWithLLM(config!, type, prompt);
  return { analysis, mock: false };
}

async function analyzeWithLLM(
  config: LLMConfig,
  type: "bazi" | "palm" | "face",
  userPrompt: string
): Promise<AnalysisResult> {
  const defaults = DEFAULT_MODELS[config.provider] ?? DEFAULT_MODELS.deepseek;
  const baseUrl = config.baseUrl ?? defaults.baseUrl;
  const model = config.model ?? defaults.model;

  const requestBody: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: buildSystemPrompt(type) },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  };

  // DeepSeek JSON Output: https://api-docs.deepseek.com/zh-cn/guides/json_mode
  if (config.provider === "deepseek") {
    requestBody.response_format = { type: "json_object" };
  }

  const callApi = async (): Promise<string | null> => {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`AI 接口调用失败: ${response.status} ${err}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? null;
  };

  let content = await callApi();
  // DeepSeek 文档说明 JSON Output 偶发空 content，这里做一次轻量重试。
  if (!content && config.provider === "deepseek") {
    content = await callApi();
  }
  if (!content) throw new Error("AI 未返回有效内容");

  return parseAnalysisResponse(content);
}

export function buildBaziPrompt(baziText: string): string {
  return `请根据以下八字信息进行详细命理分析：\n\n${baziText}`;
}

export function buildImagePrompt(type: "palm" | "face", description: string): string {
  const label = type === "palm" ? "手相" : "面相";
  return `请依照《麻衣神相》相法，根据以下${label}特征描述进行详细分析（引用印堂、山根、准头、法令纹等相理术语）：\n\n${description}`;
}

export function getImageAnalysisDescription(type: "palm" | "face"): string {
  if (type === "palm") {
    return `手相特征（基于图像识别）：
- 生命线：深长清晰，弧度适中，显示体质较好
- 智慧线：延伸至无名指下方，思维敏捷
- 感情线：较为平直，感情专一
- 事业线：中段清晰，事业运势中期上升
- 财运线：不明显但无断纹，财运平稳
- 手型：方形手，做事踏实`;
  }
  return `面相特征（麻衣神相 · 基于图像识别）：
- 天庭（额部）：宽阔饱满，主智慧早显，少年运佳
- 眉相：浓淡适中，眉顺不散，主性情温和
- 眼相：眼有神采，黑白分明，主洞察力强、识人善任
- 鼻相：准头圆润有肉，主聚财；山根不低，中年运稳
- 口相：唇厚色润，言出必行，主口福与人缘
- 法令纹：深浅适中，主晚年有靠
- 十二宫：命宫光润，财帛宫饱满，事业宫有势
- 整体：五官协调，气色尚佳，属中上之相`;
}

function formatBirthInfoForPrompt(birthInfo?: BirthInfo): string {
  if (!birthInfo) return "未提供生辰信息";
  const cal = birthInfo.calendar === "lunar" ? "农历" : "阳历";
  return `${birthInfo.name ? `姓名：${birthInfo.name}；` : ""}${cal} ${birthInfo.year}-${birthInfo.month}-${birthInfo.day} ${birthInfo.hour}:${birthInfo.minute}；性别：${birthInfo.gender === "male" ? "男" : "女"}${birthInfo.birthPlace ? `；出生地：${birthInfo.birthPlace}` : ""}`;
}

function clamp(min: number, max: number, value: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeTrend(open: number, close: number): "up" | "down" | "flat" {
  if (close > open) return "up";
  if (close < open) return "down";
  return "flat";
}

function extractJsonLike(content: string): string {
  const trimmed = content.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;

  const fenced = trimmed
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  if (fenced.startsWith("{") && fenced.endsWith("}")) return fenced;

  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first >= 0 && last > first) {
    return trimmed.slice(first, last + 1);
  }
  return trimmed;
}

function buildJsonParseDebug(
  parseError: unknown,
  provider: string,
  model: string,
  raw: string,
  jsonLike: string,
): AIJsonDebugInfo {
  const message = parseError instanceof Error ? parseError.message : String(parseError);
  const posMatch = message.match(/position\s+(\d+)/i);
  const position = posMatch ? Number(posMatch[1]) : undefined;
  let aroundError = "";

  if (typeof position === "number" && Number.isFinite(position)) {
    const start = Math.max(0, position - 100);
    const end = Math.min(jsonLike.length, position + 100);
    aroundError = jsonLike.slice(start, end);
  }

  return {
    provider,
    model,
    parseError: message,
    rawPreview: raw.slice(0, 4000),
    jsonPreview: jsonLike.slice(0, 4000),
    errorPosition: position,
    aroundError,
  };
}

export async function generateLifeKlineWithAI(
  config: LLMConfig | undefined,
  params: {
    birthInfo: BirthInfo;
    years: number;
    includeWholeLife?: boolean;
    baziText?: string;
  }
): Promise<{ periodKline: KlineData[]; fullKline: KlineData[]; overall: OverallAnalysis }> {
  if (!config?.apiKey) {
    throw new Error("未配置 AI API Key，请在服务端环境变量设置 DEEPSEEK_API_KEY");
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentAge = currentYear - params.birthInfo.year;
  const requestYears = clamp(1, 100, params.years || 10);
  const includeWholeLife = params.includeWholeLife ?? requestYears >= 100;

  const birthText = formatBirthInfoForPrompt(params.birthInfo);
  const baziNote = params.baziText ? `\n八字参考：${params.baziText}` : "";

  const period = await completeJson<LifeKlineAiResult>(
    config,
    "你是一名命理数据分析师。请严格输出 json（json_object），不要输出额外文本。",
    `请根据下列用户信息，生成“人生K线”的结构化数据。\n用户信息：${birthText}${baziNote}\n当前年份：${currentYear}，当前年龄约：${currentAge}。\n要求：\n1) 生成未来 ${requestYears} 年的年K线（从当前年份开始）。\n2) kline 为数组，每项包含 year, age, open, close, high, low，可选 ganZhi。\n3) 所有数值范围 1-100，且满足 high >= max(open, close), low <= min(open, close)。\n4) 生成 summary（100-220字）和 dimensions（11个维度，key/label/score/text）。\n5) dimensions 的 key 使用：overall,career,wealth,marriage,noble,health,safety,family,love,personality,fengshui。\n6) 输出紧凑 json，不要换行注释，不要多余字段。\n返回格式示例：{\"summary\":\"...\",\"kline\":[{\"year\":2026,\"age\":28,\"open\":62,\"close\":68,\"high\":72,\"low\":58}],\"dimensions\":[{\"key\":\"overall\",\"label\":\"整体命势\",\"score\":72,\"text\":\"...\"}]}`,
    { maxTokens: 4200, temperature: 0.4 },
  );

  let full: LifeKlineAiResult | null = null;
  if (includeWholeLife) {
    full = await completeJson<LifeKlineAiResult>(
      config,
      "你是一名命理数据分析师。请严格输出 json（json_object），不要输出额外文本。",
      `请根据下列用户信息，生成“人生K线 0-100岁”的结构化数据。\n用户信息：${birthText}${baziNote}\n要求：\n1) kline 按年龄从 0 到 100（共 101 项），year=出生年+age。\n2) 每项包含 year, age, open, close, high, low，可选 ganZhi。\n3) 所有数值范围 1-100，且满足 high >= max(open, close), low <= min(open, close)。\n4) 生成 summary（100-220字）和 dimensions（11个维度，key/label/score/text）。\n5) dimensions 的 key 使用：overall,career,wealth,marriage,noble,health,safety,family,love,personality,fengshui。\n6) 输出紧凑 json，不要换行注释，不要多余字段。\n返回格式示例：{\"summary\":\"...\",\"kline\":[{\"year\":1998,\"age\":0,\"open\":50,\"close\":52,\"high\":55,\"low\":46}],\"dimensions\":[{\"key\":\"overall\",\"label\":\"整体命势\",\"score\":72,\"text\":\"...\"}]}`,
      { maxTokens: 7800, temperature: 0.35 },
    );
  }

  const normalizeKline = (rows: LifeKlineAiResult["kline"]): KlineData[] => {
    return (rows ?? []).map((row, index) => {
      const open = clamp(1, 100, Number(row.open ?? 50));
      const close = clamp(1, 100, Number(row.close ?? open));
      const high = clamp(Math.max(open, close), 100, Number(row.high ?? Math.max(open, close)));
      const low = clamp(1, Math.min(open, close), Number(row.low ?? Math.min(open, close)));
      return {
        year: Number(row.year),
        age: Number(row.age),
        open: Math.round(open * 10) / 10,
        close: Math.round(close * 10) / 10,
        high: Math.round(high * 10) / 10,
        low: Math.round(low * 10) / 10,
        score: Math.round(close),
        trend: normalizeTrend(open, close),
        ganZhi: row.ganZhi,
        isCurrent: index === 0,
      };
    }).filter((row) => Number.isFinite(row.year) && Number.isFinite(row.age));
  };

  const normalizeDimensions = (dims: LifeKlineAiResult["dimensions"]): OverallAnalysis["dimensions"] => {
    return (dims ?? []).map((d) => ({
      key: d.key,
      label: d.label,
      score: clamp(1, 100, Number(d.score ?? 50)),
      text: d.text || "",
    }));
  };

  const periodKline = normalizeKline(period.kline);
  const fullKline = full ? normalizeKline(full.kline) : periodKline;
  const overall: OverallAnalysis = {
    summary: String((full?.summary || period.summary || "").trim()),
    dimensions: normalizeDimensions(full?.dimensions ?? period.dimensions),
  };

  if (!periodKline.length || !overall.summary || !overall.dimensions.length) {
    throw new Error("AI 返回的人生K线数据不完整");
  }

  return {
    periodKline,
    fullKline,
    overall,
  };
}

export async function generateMonthlyKlineWithAI(
  config: LLMConfig | undefined,
  params: {
    birthInfo: BirthInfo;
    year: number;
    baziText?: string;
  }
): Promise<KlineData[]> {
  if (!config?.apiKey) {
    throw new Error("未配置 AI API Key，请在服务端环境变量设置 DEEPSEEK_API_KEY");
  }

  const birthText = formatBirthInfoForPrompt(params.birthInfo);
  const baziNote = params.baziText ? `\n八字参考：${params.baziText}` : "";
  const age = params.year - params.birthInfo.year;

  const result = await completeJson<MonthlyKlineAiResult>(
    config,
    "你是一名命理数据分析师。请严格输出 json（json_object），不要输出额外文本。",
    `请根据用户信息生成 ${params.year} 年的月度K线数据（1-12月）。\n用户信息：${birthText}${baziNote}\n要求：\n1) 返回 kline 数组，包含 12 项，每项 month/open/close/high/low。\n2) month 从 1 到 12。\n3) 数值范围 1-100，且 high >= max(open, close), low <= min(open, close)。\n4) 输出紧凑 json，不要换行注释，不要多余字段。\n返回示例：{\"kline\":[{\"month\":1,\"open\":60,\"close\":64,\"high\":68,\"low\":57}]}`,
    { maxTokens: 2200, temperature: 0.35 },
  );

  const rows = (result.kline ?? []).map((row) => {
    const open = clamp(1, 100, Number(row.open ?? 50));
    const close = clamp(1, 100, Number(row.close ?? open));
    const high = clamp(Math.max(open, close), 100, Number(row.high ?? Math.max(open, close)));
    const low = clamp(1, Math.min(open, close), Number(row.low ?? Math.min(open, close)));
    const month = clamp(1, 12, Number(row.month ?? 1));
    return {
      month,
      year: params.year,
      age,
      open: Math.round(open * 10) / 10,
      close: Math.round(close * 10) / 10,
      high: Math.round(high * 10) / 10,
      low: Math.round(low * 10) / 10,
      score: Math.round(close),
      trend: normalizeTrend(open, close),
      isMonthly: true,
      isBirth: false,
      isCurrent: false,
      xLabel: `${month}月`,
    } as KlineData;
  }).sort((a, b) => a.month! - b.month!);

  if (rows.length !== 12) {
    throw new Error("AI 返回的月K线数据不完整");
  }

  return rows;
}

export async function askSpiritPet(
  config: LLMConfig | undefined,
  params: {
    question: string;
    birthInfo?: BirthInfo;
    petName?: string;
    petEmoji?: string;
    personName?: string;
  }
): Promise<{ answer: string; mock: boolean }> {
  if (!params.question.trim()) throw new Error("问题不能为空");
  if (!config?.apiKey) {
    throw new Error("未配置 AI API Key，请在服务端环境变量设置 DEEPSEEK_API_KEY");
  }

  const petTitle = params.petName ? `${params.petEmoji ?? ""} ${params.petName}`.trim() : "AI 灵宠";
  const userContext = formatBirthInfoForPrompt(params.birthInfo);

  const answer = await completeJson<{ answer: string }>(
    config,
    `你是一位温暖、克制且具体的命理顾问与灵宠陪伴者。\n请严格输出 json。\n返回格式：{"answer":"..."}。\nanswer 要求：1) 80-180 字；2) 给出可执行建议；3) 不夸大承诺；4) 中文输出。`,
    `用户：${params.personName ?? "用户"}\n灵宠：${petTitle}\n生辰信息：${userContext}\n问题：${params.question}`,
  );

  if (!answer?.answer?.trim()) {
    throw new Error("AI 未返回有效问答内容");
  }

  return {
    answer: params.petName ? `${petTitle}：${answer.answer.trim()}` : answer.answer.trim(),
    mock: false,
  };
}

export async function analyzeLiuyaoWithAI(
  config: LLMConfig | undefined,
  params: {
    question: string;
    guaName: string;
    guaDesc: string;
    linesText: string;
  }
): Promise<LiuyaoAiResult> {
  if (!config?.apiKey) {
    throw new Error("未配置 AI API Key，请在服务端环境变量设置 DEEPSEEK_API_KEY");
  }

  const result = await completeJson<LiuyaoAiResult>(
    config,
    `你是精通周易六爻的专业命理师。\n请严格输出 json，格式：{"analysis":"...","advice":"...","luck":"大吉|吉|平|凶|大凶"}。\nanalysis 控制在 120-260 字，advice 控制在 30-80 字，输出中文。`,
    `问题：${params.question}\n本卦：${params.guaName}卦\n卦辞：${params.guaDesc}\n六爻：${params.linesText}`,
  );

  if (!result?.analysis || !result?.advice || !result?.luck) {
    throw new Error("AI 六爻返回内容不完整");
  }

  return result;
}

async function completeJson<T>(
  config: LLMConfig,
  systemPrompt: string,
  userPrompt: string,
  options?: { maxTokens?: number; temperature?: number },
): Promise<T> {
  const defaults = DEFAULT_MODELS[config.provider] ?? DEFAULT_MODELS.deepseek;
  const baseUrl = config.baseUrl ?? defaults.baseUrl;
  const model = config.model ?? defaults.model;

  const requestBody: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 2000,
  };

  if (config.provider === "deepseek") {
    requestBody.response_format = { type: "json_object" };
  }

  const callApi = async (): Promise<string | null> => {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`AI 接口调用失败: ${response.status} ${err}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? null;
  };

  let content = await callApi();
  if (!content && config.provider === "deepseek") {
    content = await callApi();
  }
  if (!content) throw new Error("AI 未返回有效内容");

  const jsonLike = extractJsonLike(content);
  try {
    return JSON.parse(jsonLike) as T;
  } catch (err) {
    const debug = buildJsonParseDebug(
      err,
      String(config.provider),
      String(model),
      content,
      jsonLike,
    );
    console.error("[AI JSON Parse Error]", debug);
    throw new AIJsonParseError("AI 返回 JSON 解析失败", debug);
  }
}

async function analyzeImageWithVision(
  config: LLMConfig,
  type: "palm" | "face",
  imageBase64: string
): Promise<string | null> {
  try {
    const baseUrl = config.baseUrl ?? "https://api.openai.com/v1";
    const model = config.model ?? "gpt-4o-mini";
    const label = type === "palm" ? "手相" : "面相";

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `请详细描述这张${label}照片中的特征，包括线条、形状、比例等命理相关特征，200字以内。`,
              },
              {
                type: "image_url",
                image_url: { url: imageBase64 },
              },
            ],
          },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

// Legacy export removed — use analyzeBazi / analyzeImage instead