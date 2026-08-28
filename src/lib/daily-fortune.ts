// @ts-expect-error lunar-javascript has no types
import { Solar } from "lunar-javascript";
import { calculateBazi } from "./bazi";
import { normalizeBirthInfo } from "./birth-utils";
import type { BirthInfo, DailyFortuneGuide, DailyFortuneDimensionKey } from "./types";

const WUXING_MAP: Record<string, string> = {
  甲: "木", 乙: "木", 丙: "火", 丁: "火", 戊: "土", 己: "土",
  庚: "金", 辛: "金", 壬: "水", 癸: "水",
  子: "水", 丑: "土", 寅: "木", 卯: "木", 辰: "土", 巳: "火",
  午: "火", 未: "土", 申: "金", 酉: "金", 戌: "土", 亥: "水",
};

const SHENG: Record<string, string> = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
const KE: Record<string, string> = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };

const DAILY_LABELS: Record<DailyFortuneDimensionKey, string> = {
  career: "事业",
  wealth: "财富",
  social: "人际",
  health: "健康",
  emotion: "情绪",
  energy: "精力",
};

const WUXING_COLORS: Record<string, string[]> = {
  木: ["墨绿", "青绿", "碧色"],
  火: ["朱红", "橙色", "珊瑚红"],
  土: ["米白", "赭黄", "土黄"],
  金: ["金色", "银白", "香槟色"],
  水: ["藏青", "玄黑", "靛蓝"],
};

const ZHI_DIRECTION: Record<string, string> = {
  子: "北方", 丑: "东北", 寅: "东北", 卯: "东方", 辰: "东南", 巳: "东南",
  午: "南方", 未: "西南", 申: "西南", 酉: "西方", 戌: "西北", 亥: "西北",
};

const GAN_LUCKY_HOURS: Record<string, string> = {
  甲: "7:00-9:00", 乙: "9:00-11:00", 丙: "11:00-13:00", 丁: "13:00-15:00",
  戊: "7:00-9:00", 己: "9:00-11:00", 庚: "15:00-17:00", 辛: "17:00-19:00",
  壬: "21:00-23:00", 癸: "23:00-1:00",
};

const DIMENSION_WUXING: Record<DailyFortuneDimensionKey, string> = {
  career: "金",
  wealth: "土",
  social: "水",
  health: "木",
  emotion: "火",
  energy: "木",
};

const TEXT_POOL: Record<DailyFortuneDimensionKey, Record<string, string[]>> = {
  career: {
    support: ["今日流日生扶日主，宜推进关键项目，上午效率尤佳。", "贵人暗助，适合汇报成果或争取资源。"],
    same: ["运势平稳，按既定计划执行即可，不宜冒进扩张。", "宜深耕本职，巩固已有成果。"],
    overcome: ["掌控力较强，可主动协调团队、拍板决策。", "适合处理积压事务，化阻力为助力。"],
    drain: ["精力分散，宜聚焦一两件要事，避免多头并进。", "下午略疲，重要会议尽量安排在上午。"],
    overcomeBy: ["压力偏大，重大决策可缓一日，先整理思路。", "宜守不宜攻，多听少言，避免正面冲突。"],
  },
  wealth: {
    support: ["正财有进，小额收益或回款可期，宜记账复盘。", "适合洽谈合作，但条款需细审。"],
    same: ["财势平稳，专注本职比追逐偏财更稳妥。", "宜守不宜攻，控制非必要开支。"],
    overcome: ["掌控欲强，适合清理旧账、优化预算。", "可处理理财调整，见好就收。"],
    drain: ["支出略增，避免冲动消费，大额转账多核实。", "偏财一般，不宜跟风投资。"],
    overcomeBy: ["财务宜保守，忌担保借贷，现金为王。", "谨防破财，贵重物品妥善保管。"],
  },
  social: {
    support: ["人缘较佳，适合联络旧友、拓展合作。", "倾听比表达更重要，易获他人好感。"],
    same: ["社交平稳，维持现有关系即可。", "团队合作顺畅，可多给予肯定。"],
    overcome: ["立场鲜明，适合谈判，但注意语气柔和。", "宜主动破冰，化解小误会。"],
    drain: ["易因言辞引发误会，说话前先想三秒。", "减少无效社交，留出独处时间。"],
    overcomeBy: ["口舌是非略多，少议论他人，远离八卦场。", "重要承诺宜书面确认，避免口说无凭。"],
  },
  health: {
    support: ["气血较旺，适合适度运动或户外散步。", "作息规律则精力回升明显。"],
    same: ["身体平稳，维持现有习惯即可。", "注意饮食均衡，勿过饥过饱。"],
    overcome: ["宜主动调理，可做体检或调整作息。", "肩颈、腰背注意放松拉伸。"],
    drain: ["易感到疲惫，午间短休可恢复。", "忌熬夜，晚间宜早睡。"],
    overcomeBy: ["抵抗力略弱，避免过劳与受凉。", "情绪紧张时先做深呼吸，再处理事务。"],
  },
  emotion: {
    support: ["心态平和，宜表达真实感受，易获理解。", "适合 journaling 或与信任的人倾诉。"],
    same: ["情绪稳定，适合阅读、冥想等静心活动。", "不必强求开心，接纳当下即可。"],
    overcome: ["可主动化解心结，写信或当面沟通皆可。", "行动力能带动情绪，先动起来。"],
    drain: ["易感内耗，少刷负面信息，转移注意力。", "宜减少自我批判，多给自己肯定。"],
    overcomeBy: ["压力易积累，找一项小爱好释放。", "重大情绪决定宜缓一日再定。"],
  },
  energy: {
    support: ["上午精力旺盛，把要事安排在黄金时段。", "整体续航良好，可分段完成复杂任务。"],
    same: ["精力中等，劳逸结合，避免连续加班。", "午后略降，可配一杯温水提神。"],
    overcome: ["冲劲足，适合启动新项目或攻克难点。", "运动十五分钟可显著提气。"],
    drain: ["能量消耗快，任务间留缓冲，勿排太满。", "宜早睡补能，少喝咖啡。"],
    overcomeBy: ["整体偏疲，能推则推，保留体力给要事。", "宜简化日程，拒绝非必要邀约。"],
  },
};

type WxRelation = "support" | "same" | "overcome" | "drain" | "overcomeBy";

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length]!;
}

function getWuxing(char: string): string {
  return WUXING_MAP[char] ?? "土";
}

function getWxRelation(myWx: string, otherWx: string): WxRelation {
  if (myWx === otherWx) return "same";
  if (SHENG[otherWx] === myWx) return "support";
  if (SHENG[myWx] === otherWx) return "drain";
  if (KE[myWx] === otherWx) return "overcome";
  return "overcomeBy";
}

function relationScoreModifier(rel: WxRelation): number {
  switch (rel) {
    case "support": return 12;
    case "same": return 4;
    case "overcome": return 8;
    case "drain": return -4;
    case "overcomeBy": return -10;
  }
}

function getTodayGanZhi(date: string): { gan: string; zhi: string; ganZhi: string } {
  const [y, m, d] = date.split("-").map(Number);
  const solar = Solar.fromYmdHms(y!, m!, d!, 12, 0, 0);
  const ec = solar.getLunar().getEightChar();
  const gan = ec.getDayGan();
  const zhi = ec.getDayZhi();
  return { gan, zhi, ganZhi: gan + zhi };
}

function getDominantWuxing(bazi: ReturnType<typeof calculateBazi>): string {
  const match = bazi.wuxing.match(/五行偏(.)（/);
  return match?.[1] ?? getWuxing(bazi.dayMaster.charAt(0));
}

function getCurrentLiunian(bazi: ReturnType<typeof calculateBazi>, year: number): string {
  return bazi.liunian.find((l) => l.year === year)?.ganZhi ?? "";
}

function getCurrentDayun(bazi: ReturnType<typeof calculateBazi>, year: number): string {
  return bazi.dayun.find((d) => year >= d.startYear && year <= d.endYear)?.ganZhi ?? "";
}

/** 根据用户八字与日期本地生成今日运势（不调用大模型） */
export function generateDailyFortuneFromBazi(birthInfo: BirthInfo, date: string): DailyFortuneGuide {
  const normalized = normalizeBirthInfo(birthInfo);
  const bazi = calculateBazi(normalized);
  const dayMasterGan = bazi.dayMaster.charAt(0);
  const dayMasterWx = getWuxing(dayMasterGan);
  const dominantWx = getDominantWuxing(bazi);

  const today = getTodayGanZhi(date);
  const todayWx = getWuxing(today.gan);
  const dayRelation = getWxRelation(dayMasterWx, todayWx);

  const year = Number(date.slice(0, 4));
  const liunian = getCurrentLiunian(bazi, year);
  const dayun = getCurrentDayun(bazi, year);
  const liunianWx = liunian ? getWuxing(liunian.charAt(0)) : dominantWx;
  const yearRelation = getWxRelation(dayMasterWx, liunianWx);

  const seedBase = hashString(`${date}:${bazi.bazi.day}:${bazi.bazi.hour}`);

  const dimensions = (Object.keys(DAILY_LABELS) as DailyFortuneDimensionKey[]).map((key, i) => {
    const dimWx = DIMENSION_WUXING[key];
    const dimRel = getWxRelation(dayMasterWx, dimWx);
    const todayDimRel = getWxRelation(todayWx, dimWx);

    let score =
      62 +
      relationScoreModifier(dayRelation) * 0.4 +
      relationScoreModifier(yearRelation) * 0.3 +
      relationScoreModifier(dimRel) * 0.5 +
      relationScoreModifier(todayDimRel) * 0.3 +
      ((seedBase + i * 13) % 11) - 5;

    score = Math.max(45, Math.min(92, Math.round(score)));

    const relKey = dayRelation;
    const pool = TEXT_POOL[key][relKey] ?? TEXT_POOL[key].same!;
    let text = pick(pool, seedBase + i);

    if (i === 0 && dayun) {
      text = `大运${dayun}，${text}`;
    } else if (liunian && i === 1) {
      text = `${year}流年${liunian}，${text}`;
    } else {
      text = `今日${today.ganZhi}日，${dayMasterGan}日主，${text}`;
    }

    return { key, label: DAILY_LABELS[key], score, text };
  });

  const luckyWx = dayRelation === "support" || dayRelation === "same"
    ? todayWx
    : SHENG[dayMasterWx] ?? dominantWx;

  const luckyZhi = today.zhi;
  const luckyNumber = String(((TIAN_GAN_INDEX(dayMasterGan) + TIAN_GAN_INDEX(today.gan)) % 9) + 1);

  return {
    date,
    generatedAt: new Date().toISOString(),
    dimensions,
    lucky: {
      color: pick(WUXING_COLORS[luckyWx] ?? WUXING_COLORS.土!, seedBase),
      number: luckyNumber,
      direction: ZHI_DIRECTION[luckyZhi] ?? "东方",
      time: GAN_LUCKY_HOURS[today.gan] ?? GAN_LUCKY_HOURS[dayMasterGan] ?? "9:00-11:00",
    },
  };
}

function TIAN_GAN_INDEX(gan: string): number {
  const order = "甲乙丙丁戊己庚辛壬癸";
  const idx = order.indexOf(gan);
  return idx >= 0 ? idx : 0;
}
