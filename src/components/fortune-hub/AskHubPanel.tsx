"use client";

import { useEffect, useState } from "react";
import SpiritPetChatPanel from "@/components/SpiritPetChatPanel";
import { resolveSpiritPetPageState } from "@/lib/spirit-pet-page-state";
import { usePetFoodRemaining } from "@/hooks/usePetFoodRemaining";
import { formatPetFoodRemaining } from "@/lib/pet-food-remaining";
import type { BirthInfo, SpiritPetProfile } from "@/lib/types";
import BoostFortuneButton from "@/components/BoostFortuneButton";

export default function AskHubPanel() {
  const [pet, setPet] = useState<SpiritPetProfile | null>(null);
  const [birth, setBirth] = useState<BirthInfo | null>(null);
  const [personName, setPersonName] = useState("主人");
  const remaining = usePetFoodRemaining();

  useEffect(() => {
    const snap = resolveSpiritPetPageState();
    if (snap.pet?.claimed) {
      setPet(snap.pet);
      setBirth(snap.birth);
      setPersonName(snap.personName);
    }
  }, []);

  if (!pet) {
    return (
      <div className="app-card py-8 text-center">
        <p className="text-4xl">🦄</p>
        <p className="mt-3 text-sm text-app-muted">请先收养 AI 灵宠，再与守护灵对话</p>
      </div>
    );
  }

  return (
    <>
      <p className="caption mb-3 text-app-muted">问 AI 灵宠 · {formatPetFoodRemaining(remaining)}</p>
      <SpiritPetChatPanel
        pet={pet}
        personName={personName}
        birthInfo={birth}
      />
      <div className="page-section">
        <BoostFortuneButton />
      </div>
    </>
  );
}
