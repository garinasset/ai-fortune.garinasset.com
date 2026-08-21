import type { AnalysisResult, LLMConfig, BaziResult, BirthInfo, KlineData, OverallAnalysis } from "./types";
import {
  generateForwardYearsKline,
  generateFullLifeKline,
  generateMonthlyKline,
  generateOverallAnalysis,
  annotateKlineExtremes,
} from "./fortune-chart";
import {
  getMockBaziAnalysis,
  getMockImageAnalysis,
  getMockLiuyaoResult,
  getMockSpiritPetAnswer,
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

/** 无 API Key 或 FORCE_MOCK_MODE 时使用本地测试数据 */
export function isMockMode(config?: LLMConfig): boolean {
  return MOCK_MODE || !config?.apiKey;
}

/** isMockMode 为 false 时调用，将 config 收窄为 LLMConfig */
function requireLLMConfig(config: LLMConfig | undefined): LLMConfig {
  if (!config?.apiKey) {
    throw new Error("LLM API Key 未配置");
  }
  return config;
}

export async function analyzeBazi(
  config: LLMConfig | undefined,
  bazi: BaziResult,
  baziText: string
): Promise<{ analysis: AnalysisResult; mock: boolean }> {
  if (isMockMode(config)) {
    await simulateAnalysisDelay();
    return { analysis: getMockBaziAnalysis(bazi), mock: true };
  }

  const analysis = await analyzeWithLLM(requireLLMConfig(config), "bazi", buildBaziPrompt(baziText));
  return { analysis, mock: false };
}

export async function analyzeImage(
  config: LLMConfig | undefined,
  type: "palm" | "face",
  imageBase64: string,
  description: string
): Promise<{ analysis: AnalysisResult; mock: boolean }> {
  if (isMockMode(config)) {
    await simulateAnalysisDelay();
    return {
      analysis: getMockImageAnalysis(type, imageBase64.slice(-200)),
      mock: true,
    };
  }

  let prompt = buildImagePrompt(type, description);

  if (config?.provider === "openai") {
    const visionResult = await analyzeImageWithVision(requireLLMConfig(config), type, imageBase64);
    if (visionResult) {
      prompt = buildImagePrompt(type, visionResult);
    }
  }

  const analysis = await analyzeWithLLM(requireLLMConfig(config), type, prompt);
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

/** 修复 AI 常见 JSON 瑕疵：尾逗号、截断未闭合括号等 */
function repairJsonLike(jsonLike: string): string {
  let s = jsonLike.trim();
  s = s.replace(/,\s*([\]}])/g, "$1");

  let braces = 0;
  let brackets = 0;
  let inStr = false;
  let esc = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i]!;
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === "{") braces++;
    else if (c === "}") braces--;
    else if (c === "[") brackets++;
    else if (c === "]") brackets--;
  }
  if (braces > 0 || brackets > 0) {
    s = s.replace(/,\s*"[^"\\]*(?:\\.[^"\\]*)*"?\s*:?\s*"?[^"\\]*(?:\\.[^"\\]*)*"?\s*$/, "");
    s = s.replace(/,\s*\{[^}]*$/, "");
    s = s.replace(/,\s*$/, "");
  }
  while (brackets > 0) {
    s += "]";
    brackets--;
  }
  while (braces > 0) {
    s += "}";
    braces--;
  }
  return s;
}

function parseAiJson<T>(content: string): T {
  const raw = extractJsonLike(content);
  const candidates = [raw, repairJsonLike(raw)];
  let lastErr: unknown;
  for (const jsonLike of candidates) {
    try {
      return JSON.parse(jsonLike) as T;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
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
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentAge = currentYear - params.birthInfo.year;
  const requestYears = clamp(1, 100, params.years || 10);
  const includeWholeLife = params.includeWholeLife ?? requestYears >= 100;

  if (isMockMode(config)) {
    await simulateAnalysisDelay();
    const periodKline = generateForwardYearsKline(params.birthInfo, requestYears);
    const fullKline = includeWholeLife
      ? generateFullLifeKline(params.birthInfo)
      : periodKline;
    const overall = generateOverallAnalysis(fullKline, params.birthInfo);
    return { periodKline, fullKline, overall };
  }

  try {
    return await generateLifeKlineFromLLM(config, params, {
      currentYear,
      currentAge,
      requestYears,
      includeWholeLife,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const shouldFallback =
      isAIJsonParseError(err) ||
      message.includes("AI 接口") ||
      message.includes("JSON") ||
      message.includes("不完整") ||
      message.includes("未返回");
    if (!shouldFallback) throw err;
    console.error("[generateLifeKlineWithAI] AI failed, using local fallback:", err);
    const periodKline = annotateKlineExtremes(
      generateForwardYearsKline(params.birthInfo, requestYears),
    );
    const fullKline = annotateKlineExtremes(
      includeWholeLife ? generateFullLifeKline(params.birthInfo) : periodKline,
    );
    const overall = generateOverallAnalysis(fullKline, params.birthInfo);
    return { periodKline, fullKline, overall };
  }
}

async function generateLifeKlineFromLLM(
  config: LLMConfig | undefined,
  params: {
    birthInfo: BirthInfo;
    years: number;
    includeWholeLife?: boolean;
    baziText?: string;
  },
  ctx: {
    currentYear: number;
    currentAge: number;
    requestYears: number;
    includeWholeLife: boolean;
  },
): Promise<{ periodKline: KlineData[]; fullKline: KlineData[]; overall: OverallAnalysis }> {
  const { currentYear, currentAge, requestYears, includeWholeLife } = ctx;
  const birthText = formatBirthInfoForPrompt(params.birthInfo);
  const baziNote = params.baziText ? `\n八字参考：${params.baziText}` : "";

  const llmConfig = requireLLMConfig(config);

  const period = await completeJson<LifeKlineAiResult>(
    llmConfig,
    "你是一名命理数据分析师。请严格输出 json（json_object），不要输出额外文本。",
    `请根据下列用户信息，生成“人生K线”的结构化数据。\n用户信息：${birthText}${baziNote}\n当前年份：${currentYear}，当前年龄约：${currentAge}。\n要求：\n1) 生成未来 ${requestYears} 年的年K线（从当前年份开始，必须连续、升序、不得缺年）。\n2) kline 为数组，每项包含 year, age, open, close, high, low，可选 ganZhi。\n3) 必须满足 age = year - 出生年。\n4) 所有数值范围 1-100，且满足 high >= max(open, close), low <= min(open, close)。\n5) K线风格需接近股票市场：存在上升段、回撤段、震荡段，不允许长期单边；任意连续同向K线不超过 4 根。\n6) 邻近年份变化要平滑，避免不合理断崖跳变（通常 |close-open| <= 15，且相邻 close 差值通常 <= 18）。\n7) 生成 summary（100-220字）和 dimensions（11个维度，key/label/score/text）。\n8) dimensions 的 key 使用：overall,career,wealth,marriage,noble,health,safety,family,love,personality,fengshui。\n9) 输出紧凑 json，不要换行注释，不要多余字段。\n返回格式示例：{\"summary\":\"...\",\"kline\":[{\"year\":2026,\"age\":28,\"open\":62,\"close\":68,\"high\":72,\"low\":58}],\"dimensions\":[{\"key\":\"overall\",\"label\":\"整体命势\",\"score\":72,\"text\":\"...\"}]}`,
    { maxTokens: 8000, temperature: 0.4 },
  );

  let full: LifeKlineAiResult | null = null;
  if (includeWholeLife) {
    full = await completeJson<LifeKlineAiResult>(
      llmConfig,
      "你是一名命理数据分析师。请严格输出 json（json_object），不要输出额外文本。",
      `请根据下列用户信息，生成“人生K线 0-100岁”的结构化数据。\n用户信息：${birthText}${baziNote}\n要求：\n1) kline 必须按年龄从 0 到 100（共 101 项，连续、升序、不得缺失），且 year=出生年+age。\n2) 每项仅包含 year, age, open, close, high, low（不要 ganZhi，不要多余字段）。\n3) 所有数值范围 1-100，且满足 high >= max(open, close), low <= min(open, close)。\n4) K线风格需接近股票市场：不同人生阶段有趋势切换与波动，不允许 10 年以上明显单边；任意连续同向K线不超过 4 根。\n5) 邻近年龄变化要平滑，避免不合理断崖跳变（通常 |close-open| <= 15，且相邻 close 差值通常 <= 18）。\n6) 生成 summary（100-220字）和 dimensions（11个维度，key/label/score/text）。\n7) dimensions 的 key 使用：overall,career,wealth,marriage,noble,health,safety,family,love,personality,fengshui。\n8) 输出紧凑 json，不要换行注释，不要多余字段。\n返回格式示例：{\"summary\":\"...\",\"kline\":[{\"year\":1998,\"age\":0,\"open\":50,\"close\":52,\"high\":55,\"low\":46}],\"dimensions\":[{\"key\":\"overall\",\"label\":\"整体命势\",\"score\":72,\"text\":\"...\"}]}`,
      { maxTokens: 16384, temperature: 0.35 },
    );
  }

  function applyMarketWave(rows: KlineData[], mode: "period" | "full"): KlineData[] {
    if (rows.length <= 1) return rows;

    const phaseLen = mode === "full" ? 12 : 6;
    const waveAmp = mode === "full" ? 5.5 : 4.5;
    const maxRun = mode === "full" ? 4 : 3;

    let runDir: "up" | "down" | null = null;
    let runLen = 0;
    let prevClose = rows[0]!.close;

    return rows.map((row, index) => {
      let open = index === 0 ? row.open : prevClose;

      // 注入温和波动：保留 AI 趋势，同时增加“趋势-回撤-震荡”节奏。
      const wave = Math.sin((index / phaseLen) * Math.PI * 2) * waveAmp;
      const desired = clamp(1, 100, row.close * 0.78 + (open + wave) * 0.22);
      let close = clamp(open - 15, open + 15, desired);

      // 限制连续同向 K 线过长，避免“连续吉/凶”失真。
      let dir: "up" | "down" = close >= open ? "up" : "down";
      if (runDir === dir) {
        runLen += 1;
      } else {
        runDir = dir;
        runLen = 1;
      }
      if (runLen > maxRun) {
        const push = Math.min(4, runLen - maxRun + 1);
        close = dir === "up" ? open - push : open + push;
        dir = close >= open ? "up" : "down";
        runDir = dir;
        runLen = 1;
      }

      // 保留原蜡烛“上下影线风格”，并满足 K 线约束。
      const upWick = Math.max(1, row.high - Math.max(row.open, row.close));
      const downWick = Math.max(1, Math.min(row.open, row.close) - row.low);
      const bodyTop = Math.max(open, close);
      const bodyBottom = Math.min(open, close);
      const high = clamp(bodyTop, 100, bodyTop + upWick);
      const low = clamp(1, bodyBottom, bodyBottom - downWick);

      const shaped: KlineData = {
        ...row,
        open: Math.round(open * 10) / 10,
        close: Math.round(close * 10) / 10,
        high: Math.round(high * 10) / 10,
        low: Math.round(low * 10) / 10,
        score: Math.round(close),
        trend: normalizeTrend(open, close),
      };
      prevClose = shaped.close;
      return shaped;
    });
  }

  function sanitizeCandle(
    raw: LifeKlineAiResult["kline"][number] | undefined,
    year: number,
    age: number,
    prevClose: number,
  ): KlineData {
    const fallbackOpen = clamp(1, 100, prevClose);
    const rawOpen = Number(raw?.open);
    const open = clamp(1, 100, Number.isFinite(rawOpen) ? rawOpen : fallbackOpen);

    const rawClose = Number(raw?.close);
    const close = clamp(1, 100, Number.isFinite(rawClose) ? rawClose : open);

    const minBody = Math.min(open, close);
    const maxBody = Math.max(open, close);
    const rawHigh = Number(raw?.high);
    const rawLow = Number(raw?.low);
    const high = clamp(maxBody, 100, Number.isFinite(rawHigh) ? rawHigh : maxBody);
    const low = clamp(1, minBody, Number.isFinite(rawLow) ? rawLow : minBody);

    return {
      year,
      age,
      open: Math.round(open * 10) / 10,
      close: Math.round(close * 10) / 10,
      high: Math.round(high * 10) / 10,
      low: Math.round(low * 10) / 10,
      score: Math.round(close),
      trend: normalizeTrend(open, close),
      ganZhi: raw?.ganZhi,
      isCurrent: year === currentYear,
    };
  }

  const normalizePeriodKline = (rows: LifeKlineAiResult["kline"]): KlineData[] => {
    const byYear = new Map<number, LifeKlineAiResult["kline"][number]>();
    for (const row of rows ?? []) {
      const y = Number(row?.year);
      if (!Number.isFinite(y)) continue;
      if (!byYear.has(y)) byYear.set(y, row);
    }

    const list: KlineData[] = [];
    let prevClose = 50;
    for (let i = 0; i < requestYears; i++) {
      const year = currentYear + i;
      const age = year - params.birthInfo.year;
      const bar = sanitizeCandle(byYear.get(year), year, age, prevClose);
      list.push(bar);
      prevClose = bar.close;
    }
    return list.map((row, idx) => ({ ...row, isCurrent: idx === 0 }));
  };

  const normalizeFullKline = (rows: LifeKlineAiResult["kline"]): KlineData[] => {
    const byAge = new Map<number, LifeKlineAiResult["kline"][number]>();
    for (const row of rows ?? []) {
      const age = Number(row?.age);
      if (!Number.isFinite(age)) continue;
      if (age < 0 || age > 100) continue;
      if (!byAge.has(age)) byAge.set(age, row);
    }

    const list: KlineData[] = [];
    let prevClose = 50;
    for (let age = 0; age <= 100; age++) {
      const year = params.birthInfo.year + age;
      const bar = sanitizeCandle(byAge.get(age), year, age, prevClose);
      list.push(bar);
      prevClose = bar.close;
    }

    if (!list.some((row) => row.isCurrent)) {
      const nearest = list.reduce((best, row, idx, arr) => {
        const bestDiff = Math.abs(arr[best]!.year - currentYear);
        const curDiff = Math.abs(row.year - currentYear);
        return curDiff < bestDiff ? idx : best;
      }, 0);
      return list.map((row, idx) => ({ ...row, isCurrent: idx === nearest }));
    }

    return list;
  };

  const normalizeDimensions = (dims: LifeKlineAiResult["dimensions"]): OverallAnalysis["dimensions"] => {
    return (dims ?? []).map((d) => ({
      key: d.key,
      label: d.label,
      score: clamp(1, 100, Number(d.score ?? 50)),
      text: d.text || "",
    }));
  };

  const periodKline = annotateKlineExtremes(
    applyMarketWave(normalizePeriodKline(period.kline), "period"),
  );
  const fullKline = annotateKlineExtremes(
    full
      ? applyMarketWave(normalizeFullKline(full.kline), "full")
      : periodKline,
  );
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
  if (isMockMode(config)) {
    await simulateAnalysisDelay();
    return generateMonthlyKline(params.birthInfo, params.year);
  }

  try {
    return await generateMonthlyKlineFromLLM(config, params);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const shouldFallback =
      isAIJsonParseError(err) ||
      message.includes("AI 接口") ||
      message.includes("JSON") ||
      message.includes("未返回");
    if (!shouldFallback) throw err;
    console.error("[generateMonthlyKlineWithAI] AI failed, using local fallback:", err);
    return generateMonthlyKline(params.birthInfo, params.year);
  }
}

async function generateMonthlyKlineFromLLM(
  config: LLMConfig | undefined,
  params: {
    birthInfo: BirthInfo;
    year: number;
    baziText?: string;
  },
): Promise<KlineData[]> {
  const birthText = formatBirthInfoForPrompt(params.birthInfo);
  const baziNote = params.baziText ? `\n八字参考：${params.baziText}` : "";
  const age = params.year - params.birthInfo.year;

  const result = await completeJson<MonthlyKlineAiResult>(
    requireLLMConfig(config),
    "你是一名命理数据分析师。请严格输出 json（json_object），不要输出额外文本。",
    `请根据用户信息生成 ${params.year} 年的月度K线数据（1-12月）。\n用户信息：${birthText}${baziNote}\n要求：\n1) 返回 kline 数组，包含 12 项，每项 month/open/close/high/low。\n2) month 从 1 到 12。\n3) 数值范围 1-100，且 high >= max(open, close), low <= min(open, close)。\n4) 输出紧凑 json，不要换行注释，不要多余字段。\n返回示例：{\"kline\":[{\"month\":1,\"open\":60,\"close\":64,\"high\":68,\"low\":57}]}`,
    { maxTokens: 2200, temperature: 0.35 },
  );

  const byMonth = new Map<number, MonthlyKlineAiResult["kline"][number]>();
  for (const row of result.kline ?? []) {
    const m = Number(row?.month);
    if (!Number.isFinite(m)) continue;
    const month = clamp(1, 12, m);
    if (!byMonth.has(month)) byMonth.set(month, row);
  }

  const now = new Date();
  const isCurrentYear = params.year === now.getFullYear();
  const rows: KlineData[] = [];
  let prevClose = 50;

  for (let month = 1; month <= 12; month++) {
    const raw = byMonth.get(month);
    const open = clamp(1, 100, Number.isFinite(Number(raw?.open)) ? Number(raw?.open) : prevClose);
    const close = clamp(1, 100, Number.isFinite(Number(raw?.close)) ? Number(raw?.close) : open);
    const high = clamp(Math.max(open, close), 100, Number.isFinite(Number(raw?.high)) ? Number(raw?.high) : Math.max(open, close));
    const low = clamp(1, Math.min(open, close), Number.isFinite(Number(raw?.low)) ? Number(raw?.low) : Math.min(open, close));
    rows.push({
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
      isCurrent: isCurrentYear && month === now.getMonth() + 1,
      xLabel: `${month}月`,
    });
    prevClose = close;
  }

  return annotateKlineExtremes(rows);
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
  if (isMockMode(config)) {
    await simulateAnalysisDelay(800);
    return {
      answer: getMockSpiritPetAnswer(params),
      mock: true,
    };
  }

  const petTitle = params.petName ? `${params.petEmoji ?? ""} ${params.petName}`.trim() : "AI 灵宠";
  const userContext = formatBirthInfoForPrompt(params.birthInfo);

  const answer = await completeJson<{ answer: string }>(
    requireLLMConfig(config),
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
    birthInfo?: BirthInfo;
    baziText?: string;
  }
): Promise<LiuyaoAiResult> {
  if (isMockMode(config)) {
    await simulateAnalysisDelay();
    return getMockLiuyaoResult(params);
  }

  const birthText = formatBirthInfoForPrompt(params.birthInfo);
  const baziNote = params.baziText ? `\n八字：${params.baziText}` : "";

  const result = await completeJson<LiuyaoAiResult>(
    requireLLMConfig(config),
    `你是精通周易六爻的专业命理师。\n请严格输出 json，格式：{"analysis":"...","advice":"...","luck":"大吉|吉|平|凶|大凶"}。\nanalysis 控制在 120-260 字，advice 控制在 30-80 字，输出中文。结合问卦者生辰与卦象综合断事。`,
    `问卦者：${birthText}${baziNote}\n问题：${params.question}\n本卦：${params.guaName}卦\n卦辞：${params.guaDesc}\n六爻：${params.linesText}`,
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

  let lastErr: unknown;
  let lastJsonLike = "";
  let lastRaw = content;
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) {
      content = await callApi();
      if (!content) break;
      lastRaw = content;
    }
    lastJsonLike = extractJsonLike(content);
    try {
      return parseAiJson<T>(content);
    } catch (err) {
      lastErr = err;
    }
  }

  const debug = buildJsonParseDebug(
    lastErr,
    String(config.provider),
    String(model),
    lastRaw,
    lastJsonLike,
  );
  console.error("[AI JSON Parse Error]", debug);
  throw new AIJsonParseError("AI 返回 JSON 解析失败", debug);
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