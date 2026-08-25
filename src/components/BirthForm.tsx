"use client";

import { useState, useEffect, useCallback } from "react";
import type { BirthInfo } from "@/lib/types";
import { loadBirthInfo, saveBirthInfo, getEffectiveBirthInfo } from "@/lib/birth-store";
import { getActivePersonId, updateSavedPerson } from "@/lib/person-store";
import {
  BIRTH_COUNTRIES,
  CHINA_PROVINCES,
  formatBirthPlace,
  getCitiesForProvince,
  parseBirthPlace,
} from "@/lib/birth-regions";
import { formatBirthConversionHint } from "@/lib/birth-utils";

interface BirthFormProps {
  onSubmit: (info: BirthInfo) => void;
  loading?: boolean;
  submitLabel?: string;
  compact?: boolean;
  syncActivePerson?: boolean;
  onValuesChange?: (info: BirthInfo) => void;
  hideSubmit?: boolean;
  hideName?: boolean;
  requireName?: boolean;
  formId?: string;
}

const fieldLabel = "mb-0.5 block text-[11px] font-medium text-app-muted";
const fieldInput = "w-full rounded-lg border border-app-border bg-app-card px-2.5 py-1.5 text-sm text-app-text outline-none transition-colors focus:border-app-accent focus:shadow-[0_0_0_2px_var(--color-accent-glow)]";
const toggleBtn = (active: boolean) =>
  `flex-1 rounded-lg border py-1.5 text-xs ${
    active ? "border-app-accent bg-app-accent/10 text-app-accent" : "border-app-border text-app-muted"
  }`;

export default function BirthForm({
  onSubmit,
  loading,
  submitLabel = "生成人生 K 线",
  compact,
  syncActivePerson = true,
  onValuesChange,
  hideSubmit,
  hideName,
  requireName,
  formId,
}: BirthFormProps) {
  const now = new Date();
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [year, setYear] = useState(1990);
  const [month, setMonth] = useState(5);
  const [day, setDay] = useState(15);
  const [hour, setHour] = useState(8);
  const [minute, setMinute] = useState(30);
  const [gender, setGender] = useState<"male" | "female">("male");
  const [calendar, setCalendar] = useState<"solar" | "lunar">("solar");
  const [country, setCountry] = useState<string>(BIRTH_COUNTRIES[0]);
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [loaded, setLoaded] = useState(false);

  const cities = getCitiesForProvince(province);

  useEffect(() => {
    try {
      const saved = getEffectiveBirthInfo() ?? loadBirthInfo();
      if (saved) {
        setName(saved.name ?? "");
        setYear(saved.year);
        setMonth(saved.month);
        setDay(saved.day);
        setHour(saved.hour);
        setMinute(saved.minute);
        setGender(saved.gender);
        setCalendar(saved.calendar ?? "solar");
        const place = parseBirthPlace(saved.birthPlace);
        setCountry(place.country);
        setProvince(place.province);
        setCity(place.city);
      }
    } catch {
      // ignore invalid stored birth info
    }
    setLoaded(true);
  }, []);

  const buildInfo = useCallback((): BirthInfo => ({
    year, month, day, hour, minute, gender,
    name: name || undefined,
    calendar,
    birthPlace: formatBirthPlace(country, province, city),
  }), [year, month, day, hour, minute, gender, name, calendar, country, province, city]);

  useEffect(() => {
    if (!loaded || !onValuesChange) return;
    onValuesChange(buildInfo());
  }, [loaded, buildInfo, onValuesChange]);

  const handleProvinceChange = (value: string) => {
    setProvince(value);
    const nextCities = getCitiesForProvince(value);
    setCity(nextCities[0] ?? "");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (requireName && !name.trim()) {
      setNameError("请填写姓名");
      return;
    }
    setNameError(null);
    const info = saveBirthInfo(buildInfo());
    if (syncActivePerson) {
      const activeId = getActivePersonId();
      if (activeId) {
        updateSavedPerson(activeId, { birthInfo: info, name: info.name ?? (name || "测算人") });
      }
    }
    onSubmit(info);
  };

  if (!loaded) return null;

  const conversionHint = (() => {
    try {
      return formatBirthConversionHint(buildInfo());
    } catch {
      return "";
    }
  })();

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-2">
      <div>
        <label className={fieldLabel}>历法</label>
        <div className="flex gap-1.5">
          {([["solar", "阳历"], ["lunar", "农历"]] as const).map(([val, label]) => (
            <button key={val} type="button" onClick={() => setCalendar(val)} className={toggleBtn(calendar === val)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {!compact && hideName && (
        <div>
          <label className={fieldLabel}>性别</label>
          <div className="flex gap-1.5">
            {(["male", "female"] as const).map((g) => (
              <button key={g} type="button" onClick={() => setGender(g)} className={toggleBtn(gender === g)}>
                {g === "male" ? "男" : "女"}
              </button>
            ))}
          </div>
        </div>
      )}

      {!compact && !hideName && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={fieldLabel}>{requireName ? "姓名（必填）" : "姓名（选填）"}</label>
            <input className={fieldInput} value={name} onChange={(e) => { setName(e.target.value); setNameError(null); }} placeholder={requireName ? "请输入您的姓名" : "请输入"} required={requireName} />
            {nameError && <p className="mt-0.5 text-[10px] text-red-400">{nameError}</p>}
          </div>
          <div>
            <label className={fieldLabel}>性别</label>
            <div className="flex gap-1.5">
              {(["male", "female"] as const).map((g) => (
                <button key={g} type="button" onClick={() => setGender(g)} className={toggleBtn(gender === g)}>
                  {g === "male" ? "男" : "女"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {compact && !hideName && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={fieldLabel}>性别</label>
            <div className="flex gap-1.5">
              {(["male", "female"] as const).map((g) => (
                <button key={g} type="button" onClick={() => setGender(g)} className={toggleBtn(gender === g)}>
                  {g === "male" ? "男" : "女"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={fieldLabel}>{requireName ? "姓名（必填）" : "姓名（选填）"}</label>
            <input className={fieldInput} value={name} onChange={(e) => { setName(e.target.value); setNameError(null); }} placeholder={requireName ? "请输入您的姓名" : "请输入"} required={requireName} />
            {nameError && <p className="mt-0.5 text-[10px] text-red-400">{nameError}</p>}
          </div>
        </div>
      )}

      <div>
        <label className={fieldLabel}>
          出生日期{calendar === "lunar" ? "（农历）" : "（阳历）"} · 时辰
        </label>
        <div className="grid grid-cols-5 gap-1">
          <input type="number" className={fieldInput} min={1900} max={now.getFullYear()} value={year} onChange={(e) => setYear(+e.target.value)} placeholder="年" title="年" />
          <input type="number" className={fieldInput} min={1} max={12} value={month} onChange={(e) => setMonth(+e.target.value)} placeholder="月" title="月" />
          <input type="number" className={fieldInput} min={1} max={31} value={day} onChange={(e) => setDay(+e.target.value)} placeholder="日" title="日" />
          <input type="number" className={fieldInput} min={0} max={23} value={hour} onChange={(e) => setHour(+e.target.value)} placeholder="时" title="时" />
          <input type="number" className={fieldInput} min={0} max={59} value={minute} onChange={(e) => setMinute(+e.target.value)} placeholder="分" title="分" />
        </div>
        {conversionHint && (
          <p className="mt-1 text-[10px] leading-snug text-app-accent/90">{conversionHint}</p>
        )}
      </div>

      <div>
        <label className={fieldLabel}>出生地点</label>
        <div className="grid grid-cols-3 gap-1.5">
          <select className={fieldInput} value={country} onChange={(e) => setCountry(e.target.value)}>
            {BIRTH_COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select className={fieldInput} value={province} onChange={(e) => handleProvinceChange(e.target.value)}>
            <option value="">省/直辖市</option>
            {CHINA_PROVINCES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select className={fieldInput} value={city} onChange={(e) => setCity(e.target.value)} disabled={!province}>
            <option value="">城市</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {!hideSubmit && (
        <button type="submit" className="app-btn app-btn-sm mt-1 w-full" disabled={loading}>
          {loading ? "分析中..." : submitLabel}
        </button>
      )}
    </form>
  );
}
