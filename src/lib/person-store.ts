import type { BirthInfo, SavedPerson } from "./types";
import { normalizeBirthInfo, isValidBirthInfo } from "./birth-utils";

const PERSONS_KEY = "ai-fortune-saved-persons";
const ACTIVE_KEY = "ai-fortune-active-person-id";
const BIRTH_KEY = "ai-fortune-birth";

export const PRIMARY_PERSON_NAME = "我";

function resolveStoredPersonName(birthInfo: BirthInfo): string {
  const trimmed = birthInfo.name?.trim();
  if (trimmed && trimmed !== PRIMARY_PERSON_NAME) return trimmed;
  return `命理者${birthInfo.year}`;
}

function normalizePerson(p: SavedPerson): SavedPerson | null {
  if (!p?.id || !p.birthInfo || !isValidBirthInfo(p.birthInfo)) return null;
  try {
    const birthInfo = normalizeBirthInfo(p.birthInfo);
    const isPrimary = p.isPrimary === true || p.name === PRIMARY_PERSON_NAME;
    const name = isPrimary
      ? resolveStoredPersonName(birthInfo)
      : (p.name?.trim() || birthInfo.name?.trim() || `测算人`);
    return {
      ...p,
      name,
      birthInfo: { ...birthInfo, name: birthInfo.name?.trim() || name },
      isPrimary,
    };
  } catch {
    return null;
  }
}

export function getSavedPersons(): SavedPerson[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PERSONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizePerson).filter(Boolean) as SavedPerson[];
  } catch {
    return [];
  }
}

function savePersons(list: SavedPerson[]) {
  localStorage.setItem(PERSONS_KEY, JSON.stringify(list));
}

export function hasPrimaryPerson(): boolean {
  return getSavedPersons().some((p) => p.isPrimary);
}

export function getPrimaryPerson(): SavedPerson | null {
  return getSavedPersons().find((p) => p.isPrimary) ?? null;
}

export function addPrimaryPerson(birthInfo: BirthInfo): SavedPerson {
  const displayName = resolveStoredPersonName(birthInfo);
  const normalizedBirth = { ...normalizeBirthInfo(birthInfo), name: birthInfo.name?.trim() || displayName };
  const existing = getPrimaryPerson();
  if (existing) {
    updateSavedPerson(existing.id, { birthInfo: normalizedBirth, name: displayName });
    setActivePerson(existing.id);
    return getPrimaryPerson()!;
  }
  const person: SavedPerson = {
    id: Date.now().toString(36) + "p",
    name: displayName,
    birthInfo: normalizedBirth,
    createdAt: new Date().toISOString(),
    isPrimary: true,
  };
  const list = [...getSavedPersons(), person];
  savePersons(list);
  setActivePerson(person.id);
  return person;
}

export function addSavedPerson(name: string, birthInfo: BirthInfo): SavedPerson {
  const normalized = isValidBirthInfo(birthInfo) ? normalizeBirthInfo(birthInfo) : birthInfo;
  const person: SavedPerson = {
    id: Date.now().toString(36) + "p",
    name: name.trim() || `测算${getSavedPersons().filter((p) => !p.isPrimary).length + 1}`,
    birthInfo: { ...normalized, name: name.trim() || normalized.name },
    createdAt: new Date().toISOString(),
    isPrimary: false,
  };
  const list = [...getSavedPersons(), person];
  savePersons(list);
  return person;
}

export function updateSavedPerson(id: string, patch: Partial<Pick<SavedPerson, "name" | "birthInfo">>): void {
  const list = getSavedPersons().map((p) => {
    if (p.id !== id) return p;
    const isPrimary = p.isPrimary;
    const nextBirth = patch.birthInfo
      ? (isValidBirthInfo(patch.birthInfo) ? normalizeBirthInfo(patch.birthInfo) : patch.birthInfo)
      : p.birthInfo;
    const rawName = patch.name?.trim() ?? patch.birthInfo?.name?.trim() ?? nextBirth?.name?.trim() ?? p.name;
    const name = isPrimary && nextBirth
      ? (rawName && rawName !== PRIMARY_PERSON_NAME ? rawName : resolveStoredPersonName(nextBirth))
      : (rawName || p.name);
    return {
      ...p,
      ...patch,
      name,
      birthInfo: nextBirth ? { ...nextBirth, name: nextBirth.name?.trim() || name } : p.birthInfo,
      isPrimary,
    };
  });
  savePersons(list);
}

/** 展示用姓名：优先表单填写，避免一律显示「我」 */
export function getPersonDisplayName(birthInfo?: BirthInfo | null, fallback = "测算人"): string {
  const trimmed = birthInfo?.name?.trim();
  if (trimmed && trimmed !== PRIMARY_PERSON_NAME) return trimmed;
  if (birthInfo?.year) return resolveStoredPersonName(birthInfo);
  return fallback;
}

export function deleteSavedPerson(id: string): boolean {
  const person = getSavedPersons().find((p) => p.id === id);
  if (person?.isPrimary) return false;
  savePersons(getSavedPersons().filter((p) => p.id !== id));
  if (getActivePersonId() === id) clearActivePerson();
  return true;
}

export function getActivePersonId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_KEY);
}

export function getActivePerson(): SavedPerson | null {
  const id = getActivePersonId();
  if (!id) return getPrimaryPerson();
  const person = getSavedPersons().find((p) => p.id === id);
  if (person) return person;
  clearActivePerson();
  return getPrimaryPerson();
}

/** 设为当前测算人，并同步到全局生辰 */
export function setActivePerson(id: string | null): SavedPerson | null {
  if (typeof window === "undefined") return null;
  if (!id) {
    localStorage.removeItem(ACTIVE_KEY);
    return null;
  }
  const person = getSavedPersons().find((p) => p.id === id);
  if (!person?.birthInfo) return null;
  try {
    localStorage.setItem(ACTIVE_KEY, id);
    localStorage.setItem(BIRTH_KEY, JSON.stringify(normalizeBirthInfo(person.birthInfo)));
    return person;
  } catch {
    return null;
  }
}

export function clearActivePerson(): void {
  if (typeof window !== "undefined") localStorage.removeItem(ACTIVE_KEY);
}

export function getOtherPersons(): SavedPerson[] {
  return getSavedPersons().filter((p) => !p.isPrimary);
}

/** 发起测算前检查是否已添加主测算人 */
export function ensurePrimaryPersonBeforeCalc(): boolean {
  return hasPrimaryPerson();
}
