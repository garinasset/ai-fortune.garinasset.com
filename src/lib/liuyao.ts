/** 六爻 / 易经卦象 — 三枚铜钱法 */

const GUA_NAMES: Record<string, { name: string; desc: string }> = {
  "111111": { name: "乾", desc: "天行健，君子以自强不息" },
  "000000": { name: "坤", desc: "地势坤，君子以厚德载物" },
  "100010": { name: "屯", desc: "云雷屯，君子以经纶" },
  "010001": { name: "蒙", desc: "山下出泉，蒙" },
  "111010": { name: "需", desc: "云上于天，需" },
  "010111": { name: "讼", desc: "天与水违行，讼" },
  "010000": { name: "师", desc: "地中有水，师" },
  "000010": { name: "比", desc: "水在地上，比" },
  "111011": { name: "小畜", desc: "风行天上，小畜" },
  "110111": { name: "履", desc: "天泽履，君子以辨上下" },
  "111000": { name: "泰", desc: "天地交，泰" },
  "000111": { name: "否", desc: "天地不交，否" },
  "101111": { name: "同人", desc: "天与火，同人" },
  "111101": { name: "大有", desc: "火在天上，大有" },
  "001000": { name: "谦", desc: "地中有山，谦" },
  "000100": { name: "豫", desc: "雷出地奋，豫" },
};

export const YAO_POSITIONS = ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"] as const;

export interface YaoLine {
  value: 6 | 7 | 8 | 9;
  isYang: boolean;
  isChanging: boolean;
  label: string;
}

export interface CoinTossResult {
  /** 2=字（阴面），3=背（阳面） */
  coins: [2 | 3, 2 | 3, 2 | 3];
  line: YaoLine;
}

export interface HexagramMeta {
  pattern: string;
  guaName: string;
  guaDesc: string;
  luck: "大吉" | "吉" | "平" | "凶" | "大凶";
}

export interface HexagramResult extends HexagramMeta {
  question: string;
  lines: YaoLine[];
  analysis: string;
  advice: string;
}

function coinToss(): [2 | 3, 2 | 3, 2 | 3] {
  return [
    Math.random() > 0.5 ? 3 : 2,
    Math.random() > 0.5 ? 3 : 2,
    Math.random() > 0.5 ? 3 : 2,
  ];
}

function valueToLine(v: 6 | 7 | 8 | 9): YaoLine {
  const labels: Record<number, string> = { 6: "老阴", 7: "少阳", 8: "少阴", 9: "老阳" };
  return {
    value: v,
    isYang: v === 7 || v === 9,
    isChanging: v === 6 || v === 9,
    label: labels[v],
  };
}

/** 三枚铜钱掷一次，得一条爻 */
export function tossYaoLine(): CoinTossResult {
  const coins = coinToss();
  const sum = (coins[0] + coins[1] + coins[2]) as 6 | 7 | 8 | 9;
  return { coins, line: valueToLine(sum) };
}

/** 由六爻推算本卦信息 */
export function resolveHexagram(lines: YaoLine[]): HexagramMeta {
  const pattern = lines.map((l) => (l.isYang ? "1" : "0")).join("");
  const gua = GUA_NAMES[pattern] ?? { name: "未济", desc: "火在水上，未济" };
  const changingCount = lines.filter((l) => l.isChanging).length;
  const luckLevels: HexagramMeta["luck"][] = ["大吉", "吉", "平", "凶", "大凶"];
  const luck = luckLevels[Math.min(changingCount, 4)];
  return { pattern, guaName: gua.name, guaDesc: gua.desc, luck };
}

/** 一次性掷满六爻（兼容旧逻辑 / 测试） */
export function castHexagram(question: string): HexagramResult {
  const lines: YaoLine[] = [];
  for (let i = 0; i < 6; i++) lines.push(tossYaoLine().line);
  const meta = resolveHexagram(lines);
  const changingCount = lines.filter((l) => l.isChanging).length;

  const analysis = `所问：「${question}」\n\n得${meta.guaName}卦（${meta.pattern}）。${meta.guaDesc}。\n\n六爻从初爻到上爻：${lines.map((l, i) => `第${i + 1}爻${l.label}`).join("、")}。${changingCount > 0 ? `有${changingCount}爻动，变卦提示事态将有转折。` : "六爻安静，卦象稳定。"}`;

  const adviceMap: Record<HexagramMeta["luck"], string> = {
    大吉: "天时地利人和，宜积极行动，把握当下机遇。",
    吉: "整体向好，稳中求进，不可急躁。",
    平: "守正待时，不宜大动，韬光养晦。",
    凶: "谨慎行事，避免重大决策，以退为进。",
    大凶: "诸事不宜，宜静守反思，等待转机。",
  };

  return {
    question,
    lines,
    ...meta,
    analysis,
    advice: adviceMap[meta.luck],
  };
}

export function renderHexagramAscii(lines: YaoLine[]): string[] {
  return lines.map((l) => (l.isYang ? "———" : "— —")).reverse();
}
