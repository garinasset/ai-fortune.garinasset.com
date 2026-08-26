// @ts-expect-error lunar-javascript has no types
import { Solar } from "lunar-javascript";

export interface HuangliDay {
  /** 如：农历二〇二六年七月初十四 */
  lunarDate: string;
  /** 干支日，如：壬申日 */
  dayGanZhi: string;
  yi: string[];
  ji: string[];
}

/** 获取指定日期的老黄历（默认今天） */
export function getHuangliForDate(date: Date = new Date()): HuangliDay {
  const lunar = Solar.fromDate(date).getLunar();
  const month = lunar.getMonthInChinese();
  const day = lunar.getDayInChinese();

  return {
    lunarDate: `农历${lunar.getYearInChinese()}年${month}月${day}`,
    dayGanZhi: `${lunar.getDayInGanZhi()}日`,
    yi: lunar.getDayYi(),
    ji: lunar.getDayJi(),
  };
}

export function getTodayHuangli(): HuangliDay {
  return getHuangliForDate(new Date());
}
