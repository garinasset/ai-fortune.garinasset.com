/** 六爻 / 易经卦象 — 三枚铜钱法，完整六十四卦 */

export const YAO_POSITIONS = ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"] as const;

/** 八卦（自下而上三爻） */
const TRIGRAM_BITS = ["111", "110", "101", "100", "011", "010", "001", "000"] as const;
const TRIGRAM_NAMES = ["乾", "兑", "离", "震", "巽", "坎", "艮", "坤"] as const;
const TRIGRAM_ELEMENTS = ["天", "泽", "火", "雷", "风", "水", "山", "地"] as const;

/** 下卦为行、上卦为列 */
const HEXAGRAM_MATRIX: readonly (readonly string[])[] = [
  ["乾", "夬", "大有", "大壮", "小畜", "需", "大畜", "泰"],
  ["履", "兑", "睽", "归妹", "中孚", "节", "损", "临"],
  ["同人", "革", "离", "丰", "家人", "既济", "贲", "明夷"],
  ["无妄", "随", "噬嗑", "震", "益", "屯", "颐", "复"],
  ["姤", "大过", "鼎", "恒", "巽", "井", "蛊", "升"],
  ["讼", "困", "未济", "解", "涣", "坎", "蹇", "师"],
  ["遯", "咸", "旅", "小过", "渐", "蒙", "艮", "谦"],
  ["否", "萃", "晋", "豫", "观", "比", "剥", "坤"],
] as const;

/** 大象传摘要 — 卦象说明 */
const GUA_XIANG: Record<string, string> = {
  乾: "天行健，君子以自强不息",
  坤: "地势坤，君子以厚德载物",
  屯: "云雷屯，君子以经纶",
  蒙: "山下出泉，蒙；君子以果行育德",
  需: "云上于天，需；君子以饮食宴乐",
  讼: "天与水违行，讼；君子以作事谋始",
  师: "地中有水，师；君子以容民畜众",
  比: "水在地上，比；先王以建万国，亲诸侯",
  小畜: "风行天上，小畜；君子以懿文德",
  履: "上天下泽，履；君子以辨上下，定民志",
  泰: "天地交，泰；后以财成天地之道",
  否: "天地不交，否；君子以俭德辟难",
  同人: "天与火，同人；君子以类族辨物",
  大有: "火在天上，大有；君子以遏恶扬善",
  谦: "地中有山，谦；君子以裒多益寡",
  豫: "雷出地奋，豫；先王以作乐崇德",
  随: "泽中有雷，随；君子以向晦入宴息",
  蛊: "山下有风，蛊；君子以振民育德",
  临: "泽上有地，临；君子以教思无穷",
  观: "风行地上，观；先王以省方观民设教",
  噬嗑: "雷电噬嗑；先王以明罚敕法",
  贲: "山下有火，贲；君子以明庶政",
  剥: "山附于地，剥；上以厚下安宅",
  复: "雷在地中，复；先王以至日闭关",
  无妄: "天下雷行，物与无妄；先王以茂对时育万物",
  大畜: "天在山中，大畜；君子以多识前言往行",
  颐: "山下有雷，颐；君子以慎言语，节饮食",
  大过: "泽灭木，大过；君子以独立不惧，遁世无闷",
  坎: "水洊至，习坎；君子以修德",
  离: "明两作，离；大人以继明照于四方",
  咸: "山上有泽，咸；君子以虚受人",
  恒: "雷风，恒；君子以立不易方",
  遯: "天下有山，遯；君子以远小人，不恶而严",
  大壮: "雷在天上，大壮；君子以非礼弗履",
  晋: "明出地上，晋；君子以自昭明德",
  明夷: "明入地中，明夷；君子以莅众，用晦而明",
  家人: "风自火出，家人；君子以言有物而行有恒",
  睽: "上火下泽，睽；君子以同而异",
  蹇: "山上有水，蹇；君子以反身修德",
  解: "雷雨作，解；君子以赦过宥罪",
  损: "山下有泽，损；君子以惩忿窒欲",
  益: "风雷，益；君子以见善则迁，有过则改",
  夬: "泽上于天，夬；君子以施禄及下，居德则忌",
  姤: "天下有风，姤；后以施命诰四方",
  萃: "泽上于地，萃；君子以除戎器，戒不虞",
  升: "地中生木，升；君子以顺德，积小以高大",
  困: "泽无水，困；君子以致命遂志",
  井: "木上有水，井；君子以劳民劝相",
  革: "泽中有火，革；君子以治历明时",
  鼎: "木上有火，鼎；君子以正位凝命",
  震: "洊雷，震；君子以恐惧修省",
  艮: "兼山，艮；君子以思不出其位",
  渐: "山上有木，渐；君子以居贤德善俗",
  归妹: "雷泽，归妹；君子以永终知敝",
  丰: "雷电皆至，丰；君子以折狱致刑",
  旅: "山上有火，旅；君子以明慎用刑而不留狱",
  巽: "随风，巽；君子以申命行事",
  兑: "丽泽，兑；君子以朋友讲习",
  涣: "风行水上，涣；先王以享于帝立庙",
  节: "泽上有水，节；君子以制数度，议德行",
  中孚: "泽上有风，中孚；君子以议狱缓死",
  小过: "山上有雷，小过；君子以行过乎恭，丧过乎哀",
  既济: "水在火上，既济；君子以思患而豫防之",
  未济: "火在水上，未济；君子以慎辨物居方",
};

export interface YaoLine {
  value: 6 | 7 | 8 | 9;
  isYang: boolean;
  isChanging: boolean;
  label: string;
}

export interface CoinTossResult {
  coins: [2 | 3, 2 | 3, 2 | 3];
  line: YaoLine;
}

export interface HexagramMeta {
  pattern: string;
  guaName: string;
  guaDesc: string;
  /** 如：泽天 */
  trigramLabel: string;
  lowerTrigram: string;
  upperTrigram: string;
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

/** 三枚铜钱掷一次，得一条爻（自下而上追加） */
export function tossYaoLine(): CoinTossResult {
  const coins = coinToss();
  const sum = (coins[0] + coins[1] + coins[2]) as 6 | 7 | 8 | 9;
  return { coins, line: valueToLine(sum) };
}

function lookupHexagram(pattern: string): Pick<HexagramMeta, "guaName" | "guaDesc" | "trigramLabel" | "lowerTrigram" | "upperTrigram"> {
  const lowerBits = pattern.slice(0, 3);
  const upperBits = pattern.slice(3, 6);
  const lowerIdx = TRIGRAM_BITS.indexOf(lowerBits as (typeof TRIGRAM_BITS)[number]);
  const upperIdx = TRIGRAM_BITS.indexOf(upperBits as (typeof TRIGRAM_BITS)[number]);

  if (lowerIdx < 0 || upperIdx < 0) {
    return {
      guaName: "未济",
      guaDesc: GUA_XIANG.未济,
      trigramLabel: "火水",
      lowerTrigram: "离",
      upperTrigram: "坎",
    };
  }

  const guaName = HEXAGRAM_MATRIX[lowerIdx][upperIdx];
  const lowerTrigram = TRIGRAM_NAMES[lowerIdx];
  const upperTrigram = TRIGRAM_NAMES[upperIdx];
  const lowerEl = TRIGRAM_ELEMENTS[lowerIdx];
  const upperEl = TRIGRAM_ELEMENTS[upperIdx];

  return {
    guaName,
    guaDesc: GUA_XIANG[guaName] ?? `${upperEl}${lowerEl}，${guaName}`,
    trigramLabel: `${upperEl}${lowerEl}`,
    lowerTrigram,
    upperTrigram,
  };
}

/** 由六爻推算本卦（初爻在 pattern 最前，上爻在最后） */
export function resolveHexagram(lines: YaoLine[]): HexagramMeta {
  const pattern = lines.map((l) => (l.isYang ? "1" : "0")).join("");
  const { guaName, guaDesc, trigramLabel, lowerTrigram, upperTrigram } = lookupHexagram(pattern);
  const changingCount = lines.filter((l) => l.isChanging).length;
  const luckLevels: HexagramMeta["luck"][] = ["大吉", "吉", "平", "凶", "大凶"];
  const luck = luckLevels[Math.min(changingCount, 4)];

  return { pattern, guaName, guaDesc, trigramLabel, lowerTrigram, upperTrigram, luck };
}

/** 一次性掷满六爻（兼容旧逻辑 / 测试） */
export function castHexagram(question: string): HexagramResult {
  const lines: YaoLine[] = [];
  for (let i = 0; i < 6; i++) lines.push(tossYaoLine().line);
  const meta = resolveHexagram(lines);
  const changingCount = lines.filter((l) => l.isChanging).length;

  const analysis = `所问：「${question}」\n\n得${meta.guaName}卦（上${meta.upperTrigram}下${meta.lowerTrigram}，${meta.trigramLabel}）。${meta.guaDesc}。\n\n六爻从初爻到上爻：${lines.map((l, i) => `第${i + 1}爻${l.label}`).join("、")}。${changingCount > 0 ? `有${changingCount}爻动，变卦提示事态将有转折。` : "六爻安静，卦象稳定。"}`;

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
