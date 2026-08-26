// @ts-expect-error lunar-javascript has no types
import { Solar, Tao } from "lunar-javascript";

export interface HuangliDay {
  /** 如：农历二〇二六年七月初十四 */
  lunarDate: string;
  /** 干支日，如：壬申日 */
  dayGanZhi: string;
  /** 中国传统节日 */
  traditionalFestivals: string[];
  /** 道教节日 */
  taoistFestivals: string[];
  yi: string[];
  ji: string[];
}

/** 非中国传统节日（过滤 lunar-javascript 中的现代/洋节条目） */
const NON_TRADITIONAL_FESTIVALS = new Set([
  "元旦节", "劳动节", "儿童节", "妇女节", "青年节", "建党节", "建军节",
  "教师节", "国庆节", "植树节", "消费者权益日", "全国助残日", "全民国防教育日",
  "世界住房日", "情人节", "愚人节", "母亲节", "父亲节", "感恩节", "平安夜",
  "圣诞节", "万圣节",
]);

function collectTraditionalFestivals(solar: ReturnType<typeof Solar.fromDate>, lunar: ReturnType<typeof solar.getLunar>): string[] {
  const festivals = new Set<string>();

  for (const name of [...lunar.getFestivals(), ...lunar.getOtherFestivals(), ...solar.getFestivals()]) {
    if (name && !NON_TRADITIONAL_FESTIVALS.has(name)) festivals.add(name);
  }

  const jieQi = lunar.getJieQi();
  if (jieQi) festivals.add(jieQi);

  return [...festivals];
}

function collectTaoistFestivals(lunar: { getFestivals?: () => unknown[] }): string[] {
  try {
    const festivals = Tao.fromLunar(lunar).getFestivals() as { getName: () => string }[];
    return festivals.map((f) => f.getName()).filter(Boolean);
  } catch {
    return [];
  }
}

/** 获取指定日期的老黄历（默认今天） */
export function getHuangliForDate(date: Date = new Date()): HuangliDay {
  const solar = Solar.fromDate(date);
  const lunar = solar.getLunar();
  const month = lunar.getMonthInChinese();
  const day = lunar.getDayInChinese();

  return {
    lunarDate: `农历${lunar.getYearInChinese()}年${month}月${day}`,
    dayGanZhi: `${lunar.getDayInGanZhi()}日`,
    traditionalFestivals: collectTraditionalFestivals(solar, lunar),
    taoistFestivals: collectTaoistFestivals(lunar),
    yi: lunar.getDayYi(),
    ji: lunar.getDayJi(),
  };
}

export function getTodayHuangli(): HuangliDay {
  return getHuangliForDate(new Date());
}
