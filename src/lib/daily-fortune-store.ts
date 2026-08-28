import type { BirthInfo, DailyFortuneGuide } from "./types";
import { hashBirth } from "./fortune-chart";
import { safeLocalGet, safeLocalSet } from "./safe-storage";
import { getOrCreateUser, hasRegisteredAccount } from "./user-store";
import { getPrimaryPerson } from "./person-store";
import { isValidBirthInfo, normalizeBirthInfo } from "./birth-utils";

const STORAGE_KEY = "ai-fortune-daily-guide";

export function todayDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function cacheKey(userId: string, birthInfo: BirthInfo, date: string): string {
  return `${userId}:${hashBirth(normalizeBirthInfo(birthInfo))}:${date}`;
}

function readAll(): Record<string, DailyFortuneGuide> {
  const raw = safeLocalGet(STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, DailyFortuneGuide>;
  } catch {
    return {};
  }
}

function writeAll(all: Record<string, DailyFortuneGuide>) {
  safeLocalSet(STORAGE_KEY, JSON.stringify(all));
}

export function getCachedDailyFortune(
  userId: string,
  birthInfo: BirthInfo,
  date = todayDateKey(),
): DailyFortuneGuide | null {
  const key = cacheKey(userId, birthInfo, date);
  const entry = readAll()[key];
  if (!entry || entry.date !== date) return null;
  return entry;
}

export function setCachedDailyFortune(
  userId: string,
  birthInfo: BirthInfo,
  guide: DailyFortuneGuide,
) {
  const all = readAll();
  all[cacheKey(userId, birthInfo, guide.date)] = guide;
  writeAll(all);
}

export async function fetchDailyFortuneFromApi(birthInfo: BirthInfo): Promise<DailyFortuneGuide> {
  const res = await fetch("/api/daily-fortune", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ birthInfo, date: todayDateKey() }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "今日运势生成失败");
  }
  return data.guide as DailyFortuneGuide;
}

/** 已登录用户每日至多请求一次 AI（不消耗灵丹） */
export async function ensureDailyFortuneLoaded(
  userId: string,
  birthInfo: BirthInfo,
): Promise<DailyFortuneGuide | null> {
  const cached = getCachedDailyFortune(userId, birthInfo);
  if (cached) return cached;

  const guide = await fetchDailyFortuneFromApi(birthInfo);
  setCachedDailyFortune(userId, birthInfo, guide);
  return guide;
}

/** 登录后预拉取：需已注册账号 + 主测算人 */
export function prefetchDailyFortuneForLoggedInUser(): void {
  if (typeof window === "undefined") return;
  if (!hasRegisteredAccount()) return;

  const primary = getPrimaryPerson();
  if (!primary?.birthInfo || !isValidBirthInfo(primary.birthInfo)) return;

  const user = getOrCreateUser();
  const birth = normalizeBirthInfo(primary.birthInfo);
  if (getCachedDailyFortune(user.id, birth)) return;

  void ensureDailyFortuneLoaded(user.id, birth).catch((err) => {
    console.error("prefetch daily fortune failed", err);
  });
}
