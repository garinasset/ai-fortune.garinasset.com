import type { BirthInfo } from "./types";

// @ts-expect-error lunar-javascript has no types
import { Lunar, Solar } from "lunar-javascript";

/** 将用户输入（农历或阳历）转为排盘/推演用的阳历生辰 */
export function toSolarBirthInfo(info: BirthInfo): BirthInfo {
  const normalized = normalizeBirthInfo(info);
  if (normalized.calendar !== "lunar") {
    return normalized;
  }

  try {
    const lunar = Lunar.fromYmdHms(
      normalized.year,
      normalized.month,
      normalized.day,
      normalized.hour,
      normalized.minute,
      0,
    );
    const solar = lunar.getSolar();
    return {
      ...normalized,
      year: solar.getYear(),
      month: solar.getMonth(),
      day: solar.getDay(),
    };
  } catch {
    throw new Error("农历日期无效，请检查年月日是否正确");
  }
}

function solarToLunar(year: number, month: number, day: number, hour: number, minute: number) {
  const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
  return solar.getLunar();
}

/** 格式化农历展示（用于表单提示） */
export function formatLunarDisplay(info: BirthInfo): string {
  try {
    const normalized = normalizeBirthInfo(info);
    if (normalized.calendar === "lunar") {
      const lunar = Lunar.fromYmdHms(
        normalized.year,
        normalized.month,
        normalized.day,
        normalized.hour,
        normalized.minute,
        0,
      );
      return `${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;
    }
    const lunar = solarToLunar(
      normalized.year,
      normalized.month,
      normalized.day,
      normalized.hour,
      normalized.minute,
    );
    return `${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;
  } catch {
    return "";
  }
}

/** 格式化阳历展示（农历输入时显示对应阳历） */
export function formatSolarDisplay(info: BirthInfo): string {
  try {
    const solar = info.calendar === "lunar" ? toSolarBirthInfo(info) : normalizeBirthInfo(info);
    return `${solar.year}年${solar.month}月${solar.day}日 ${String(solar.hour).padStart(2, "0")}:${String(solar.minute).padStart(2, "0")}`;
  } catch {
    return "";
  }
}

/** 表单历法换算提示文案 */
export function formatBirthConversionHint(info: BirthInfo): string {
  try {
    const normalized = normalizeBirthInfo(info);
    if (normalized.calendar === "lunar") {
      const lunar = formatLunarDisplay(normalized);
      const solar = formatSolarDisplay(normalized);
      return lunar && solar ? `农历 ${lunar} · 对应阳历 ${solar}` : "";
    }
    const lunar = formatLunarDisplay(normalized);
    return lunar ? `对应农历 ${lunar}` : "";
  } catch {
    return "";
  }
}

/** 补齐旧数据或残缺生辰，避免排盘/灵宠计算报错 */
export function normalizeBirthInfo(info: Partial<BirthInfo> & Pick<BirthInfo, "year" | "month" | "day">): BirthInfo {
  const year = Number(info.year);
  const month = Number(info.month);
  const day = Number(info.day);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    throw new Error("生辰日期无效");
  }
  return {
    year,
    month: Math.min(12, Math.max(1, month)),
    day: Math.min(31, Math.max(1, day)),
    hour: typeof info.hour === "number" && Number.isFinite(info.hour) ? Math.min(23, Math.max(0, info.hour)) : 12,
    minute: typeof info.minute === "number" && Number.isFinite(info.minute) ? Math.min(59, Math.max(0, info.minute)) : 0,
    gender: info.gender === "female" ? "female" : "male",
    name: info.name,
    calendar: info.calendar === "lunar" ? "lunar" : "solar",
    birthPlace: info.birthPlace?.trim() || undefined,
    personalityPreference: info.personalityPreference,
  };
}

export function isValidBirthInfo(info: Partial<BirthInfo> | null | undefined): info is BirthInfo {
  if (!info) return false;
  const year = Number(info.year);
  const month = Number(info.month);
  const day = Number(info.day);
  return Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day);
}
