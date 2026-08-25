// @ts-expect-error lunar-javascript has no types
import { Solar, Lunar } from "lunar-javascript";
import type { BirthInfo, BaziResult, DayunItem, LiunianItem } from "./types";
import { toSolarBirthInfo, normalizeBirthInfo } from "./birth-utils";

const TIAN_GAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const DI_ZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const WUXING_MAP: Record<string, string> = {
  甲: "木", 乙: "木", 丙: "火", 丁: "火", 戊: "土", 己: "土",
  庚: "金", 辛: "金", 壬: "水", 癸: "水",
  子: "水", 丑: "土", 寅: "木", 卯: "木", 辰: "土", 巳: "火",
  午: "火", 未: "土", 申: "金", 酉: "金", 戌: "土", 亥: "水",
};

function getGanZhi(index: number): string {
  return TIAN_GAN[index % 10] + DI_ZHI[index % 12];
}

function calculateDayun(
  birthYear: number,
  monthGanIndex: number,
  monthZhiIndex: number,
  gender: "male" | "female",
  isYangYear: boolean
): DayunItem[] {
  const dayun: DayunItem[] = [];
  const forward =
    (gender === "male" && isYangYear) || (gender === "female" && !isYangYear);
  const step = forward ? 1 : -1;

  for (let i = 0; i < 8; i++) {
    const ganIndex = (monthGanIndex + step * (i + 1) + 100) % 10;
    const zhiIndex = (monthZhiIndex + step * (i + 1) + 120) % 12;
    const startAge = 1 + i * 10;
    dayun.push({
      startAge,
      endAge: startAge + 9,
      ganZhi: TIAN_GAN[ganIndex] + DI_ZHI[zhiIndex],
      startYear: birthYear + startAge - 1,
      endYear: birthYear + startAge + 8,
    });
  }
  return dayun;
}

function calculateLiunian(birthYear: number, currentYear: number, dayun: DayunItem[]): LiunianItem[] {
  const liunian: LiunianItem[] = [];
  const baseIndex = birthYear - 4;

  for (let year = currentYear; year <= currentYear + 100; year++) {
    const age = year - birthYear + 1;
    const gzIndex = year - baseIndex;
    const ganZhi = getGanZhi(gzIndex);
    const matchedDayun = dayun.find((d) => year >= d.startYear && year <= d.endYear);
    liunian.push({
      year,
      age,
      ganZhi,
      dayun: matchedDayun?.ganZhi ?? "",
    });
  }
  return liunian;
}

export function calculateBazi(info: BirthInfo): BaziResult {
  const solarInfo = toSolarBirthInfo(normalizeBirthInfo(info));
  const solar = Solar.fromYmdHms(solarInfo.year, solarInfo.month, solarInfo.day, solarInfo.hour, solarInfo.minute, 0);
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();

  const yearGan = eightChar.getYearGan();
  const yearZhi = eightChar.getYearZhi();
  const monthGan = eightChar.getMonthGan();
  const monthZhi = eightChar.getMonthZhi();
  const dayGan = eightChar.getDayGan();
  const dayZhi = eightChar.getDayZhi();
  const timeGan = eightChar.getTimeGan();
  const timeZhi = eightChar.getTimeZhi();

  const yearGanIndex = TIAN_GAN.indexOf(yearGan);
  const isYangYear = yearGanIndex % 2 === 0;
  const monthGanIndex = TIAN_GAN.indexOf(monthGan);
  const monthZhiIndex = DI_ZHI.indexOf(monthZhi);

  const dayun = calculateDayun(solarInfo.year, monthGanIndex, monthZhiIndex, solarInfo.gender, isYangYear);
  const currentYear = new Date().getFullYear();
  const liunian = calculateLiunian(solarInfo.year, currentYear, dayun);

  const wuxingCount: Record<string, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  [yearGan, yearZhi, monthGan, monthZhi, dayGan, dayZhi, timeGan, timeZhi].forEach((c) => {
    const wx = WUXING_MAP[c];
    if (wx) wuxingCount[wx]++;
  });
  const dominant = Object.entries(wuxingCount).sort((a, b) => b[1] - a[1])[0];

  return {
    name: info.name,
    gender: solarInfo.gender === "male" ? "男" : "女",
    solarDate: `${solarInfo.year}年${solarInfo.month}月${solarInfo.day}日 ${String(solarInfo.hour).padStart(2, "0")}:${String(solarInfo.minute).padStart(2, "0")}`,
    lunarDate: `${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()} ${timeZhi}时`,
    bazi: {
      year: yearGan + yearZhi,
      month: monthGan + monthZhi,
      day: dayGan + dayZhi,
      hour: timeGan + timeZhi,
    },
    wuxing: `五行偏${dominant[0]}（${dominant[1]}个）`,
    dayMaster: `${dayGan}${WUXING_MAP[dayGan] ?? ""}日主`,
    dayun,
    liunian,
  };
}

export function formatBaziPrompt(bazi: BaziResult): string {
  return `
八字信息：
${bazi.name ? `- 姓名：${bazi.name}` : ""}
- 性别：${bazi.gender}
- 阳历：${bazi.solarDate}
- 农历：${bazi.lunarDate}
- 四柱：${bazi.bazi.year} ${bazi.bazi.month} ${bazi.bazi.day} ${bazi.bazi.hour}
- 日主：${bazi.dayMaster}
- 五行：${bazi.wuxing}
- 当前大运：${bazi.dayun.find((d) => {
    const y = new Date().getFullYear();
    return y >= d.startYear && y <= d.endYear;
  })?.ganZhi ?? "未知"}
- 未来流年：${bazi.liunian.slice(0, 10).map((l) => `${l.year}(${l.ganZhi})`).join("、")}
`.trim();
}

/** 指定公历月份的流月干支（参考节令月柱） */
export function getLiuyueGanZhi(year: number, month: number): string {
  const solar = Solar.fromYmdHms(year, month, 15, 12, 0, 0);
  const lunar = solar.getLunar();
  const ec = lunar.getEightChar();
  return ec.getMonthGan() + ec.getMonthZhi();
}
