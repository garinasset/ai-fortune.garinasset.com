import type { TarotCardMeta, TarotSuit } from "./types";

const MAJOR_ARCANA: Omit<TarotCardMeta, "suit">[] = [
  { id: "major-0", number: 0, name: "愚者", nameEn: "The Fool", keywords: "新开始、冒险、自由", symbol: "🌄", roman: "0" },
  { id: "major-1", number: 1, name: "魔术师", nameEn: "The Magician", keywords: "意志、创造、行动", symbol: "✨", roman: "I" },
  { id: "major-2", number: 2, name: "女祭司", nameEn: "The High Priestess", keywords: "直觉、潜意识、神秘", symbol: "🌙", roman: "II" },
  { id: "major-3", number: 3, name: "皇后", nameEn: "The Empress", keywords: "丰饶、滋养、美感", symbol: "👑", roman: "III" },
  { id: "major-4", number: 4, name: "皇帝", nameEn: "The Emperor", keywords: "结构、权威、稳定", symbol: "🏛️", roman: "IV" },
  { id: "major-5", number: 5, name: "教皇", nameEn: "The Hierophant", keywords: "传统、指引、信念", symbol: "📿", roman: "V" },
  { id: "major-6", number: 6, name: "恋人", nameEn: "The Lovers", keywords: "选择、关系、价值", symbol: "💞", roman: "VI" },
  { id: "major-7", number: 7, name: "战车", nameEn: "The Chariot", keywords: "前进、胜利、掌控", symbol: "🏇", roman: "VII" },
  { id: "major-8", number: 8, name: "力量", nameEn: "Strength", keywords: "勇气、耐心、内在力量", symbol: "🦁", roman: "VIII" },
  { id: "major-9", number: 9, name: "隐士", nameEn: "The Hermit", keywords: "内省、独处、智慧", symbol: "🏮", roman: "IX" },
  { id: "major-10", number: 10, name: "命运之轮", nameEn: "Wheel of Fortune", keywords: "转折、周期、机缘", symbol: "☸️", roman: "X" },
  { id: "major-11", number: 11, name: "正义", nameEn: "Justice", keywords: "公平、因果、抉择", symbol: "⚖️", roman: "XI" },
  { id: "major-12", number: 12, name: "倒吊人", nameEn: "The Hanged Man", keywords: "暂停、换位、牺牲", symbol: "🙃", roman: "XII" },
  { id: "major-13", number: 13, name: "死神", nameEn: "Death", keywords: "结束、转化、重生", symbol: "🦋", roman: "XIII" },
  { id: "major-14", number: 14, name: "节制", nameEn: "Temperance", keywords: "平衡、调和、疗愈", symbol: "🏺", roman: "XIV" },
  { id: "major-15", number: 15, name: "恶魔", nameEn: "The Devil", keywords: "欲望、束缚、阴影", symbol: "⛓️", roman: "XV" },
  { id: "major-16", number: 16, name: "塔", nameEn: "The Tower", keywords: "突变、觉醒、打破", symbol: "⚡", roman: "XVI" },
  { id: "major-17", number: 17, name: "星星", nameEn: "The Star", keywords: "希望、灵感、疗愈", symbol: "⭐", roman: "XVII" },
  { id: "major-18", number: 18, name: "月亮", nameEn: "The Moon", keywords: "迷雾、情绪、潜意识", symbol: "🌕", roman: "XVIII" },
  { id: "major-19", number: 19, name: "太阳", nameEn: "The Sun", keywords: "成功、活力、清晰", symbol: "☀️", roman: "XIX" },
  { id: "major-20", number: 20, name: "审判", nameEn: "Judgement", keywords: "觉醒、召唤、重启", symbol: "📯", roman: "XX" },
  { id: "major-21", number: 21, name: "世界", nameEn: "The World", keywords: "完成、整合、圆满", symbol: "🌍", roman: "XXI" },
];

const MINOR_RANKS: { number: number; name: string; nameEn: string }[] = [
  { number: 1, name: "Ace", nameEn: "Ace" },
  { number: 2, name: "二", nameEn: "Two" },
  { number: 3, name: "三", nameEn: "Three" },
  { number: 4, name: "四", nameEn: "Four" },
  { number: 5, name: "五", nameEn: "Five" },
  { number: 6, name: "六", nameEn: "Six" },
  { number: 7, name: "七", nameEn: "Seven" },
  { number: 8, name: "八", nameEn: "Eight" },
  { number: 9, name: "九", nameEn: "Nine" },
  { number: 10, name: "十", nameEn: "Ten" },
  { number: 11, name: "侍从", nameEn: "Page" },
  { number: 12, name: "骑士", nameEn: "Knight" },
  { number: 13, name: "皇后", nameEn: "Queen" },
  { number: 14, name: "国王", nameEn: "King" },
];

const SUITS: { suit: Exclude<TarotSuit, "major">; name: string; nameEn: string; symbol: string; keywords: string }[] = [
  { suit: "wands", name: "权杖", nameEn: "Wands", symbol: "🪄", keywords: "火元素·行动与热情" },
  { suit: "cups", name: "圣杯", nameEn: "Cups", symbol: "🏆", keywords: "水元素·情感与关系" },
  { suit: "swords", name: "宝剑", nameEn: "Swords", symbol: "⚔️", keywords: "风元素·思维与冲突" },
  { suit: "pentacles", name: "星币", nameEn: "Pentacles", symbol: "🪙", keywords: "土元素·物质与资源" },
];

function buildMinorArcana(): TarotCardMeta[] {
  const cards: TarotCardMeta[] = [];
  for (const s of SUITS) {
    for (const rank of MINOR_RANKS) {
      const isCourt = rank.number >= 11;
      const displayName = isCourt ? `${s.name}${rank.name}` : `${s.name}${rank.name}`;
      cards.push({
        id: `${s.suit}-${rank.number}`,
        suit: s.suit,
        number: rank.number,
        name: displayName,
        nameEn: `${rank.nameEn} of ${s.nameEn}`,
        keywords: s.keywords,
        symbol: s.symbol,
        roman: isCourt ? rank.nameEn.slice(0, 1) : String(rank.number),
      });
    }
  }
  return cards;
}

export const TAROT_DECK: TarotCardMeta[] = [
  ...MAJOR_ARCANA.map((c) => ({ ...c, suit: "major" as const })),
  ...buildMinorArcana(),
];

export const SUIT_LABELS: Record<TarotSuit, string> = {
  major: "大阿卡纳",
  wands: "权杖",
  cups: "圣杯",
  swords: "宝剑",
  pentacles: "星币",
};

export const SUIT_COLORS: Record<TarotSuit, { from: string; to: string; accent: string; border: string }> = {
  major: { from: "#2d1b4e", to: "#5b3a8c", accent: "#e9d5ff", border: "#c4b5fd" },
  wands: { from: "#7c2d12", to: "#ea580c", accent: "#fed7aa", border: "#fb923c" },
  cups: { from: "#0c4a6e", to: "#0284c7", accent: "#bae6fd", border: "#38bdf8" },
  swords: { from: "#334155", to: "#64748b", accent: "#e2e8f0", border: "#94a3b8" },
  pentacles: { from: "#14532d", to: "#15803d", accent: "#bbf7d0", border: "#4ade80" },
};
