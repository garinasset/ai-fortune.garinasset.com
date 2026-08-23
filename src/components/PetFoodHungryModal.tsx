"use client";

import { useMemo, useState } from "react";
import BuyFoodModal from "@/components/BuyFoodModal";
import InviteModal from "@/components/InviteModal";
import SpiritPetMediaAvatar from "@/components/SpiritPetMediaAvatar";
import { useApp } from "@/context/AppContext";
import { getInviteLink } from "@/lib/user-store";
import { REFERRAL_GIFT_BAGS, USES_PER_BAG } from "@/lib/pet-food-store";
import { resolveSpiritPetPageState } from "@/lib/spirit-pet-page-state";

interface PetFoodHungryModalProps {
  open: boolean;
  onClose: () => void;
  feature?: string;
  onPurchased?: () => void;
}

export default function PetFoodHungryModal({ open, onClose, feature, onPurchased }: PetFoodHungryModalProps) {
  const { user } = useApp();
  const [buyOpen, setBuyOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const pet = useMemo(() => {
    if (!open) return null;
    const snap = resolveSpiritPetPageState();
    return snap.pet?.claimed ? snap.pet : null;
  }, [open]);

  if (buyOpen) {
    return (
      <BuyFoodModal
        open={buyOpen}
        onClose={() => { setBuyOpen(false); onClose(); }}
        onPurchased={() => { onPurchased?.(); setBuyOpen(false); onClose(); }}
      />
    );
  }

  if (inviteOpen && user) {
    return (
      <InviteModal
        open={inviteOpen}
        onClose={() => { setInviteOpen(false); onClose(); }}
        userId={user.id}
        inviteLink={getInviteLink(user.id)}
      />
    );
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-lg rounded-t-3xl border border-app-border bg-app-card p-6 text-center sm:rounded-3xl">
        <div className="mx-auto flex justify-center spirit-pet-float">
          {pet ? (
            <SpiritPetMediaAvatar
              breedId={pet.breedId}
              emoji={pet.emoji}
              size="xl"
              preferVideo
              animate
              className="border-2 border-app-gold/35 shadow-[0_0_24px_rgba(212,165,116,0.2)]"
            />
          ) : (
            <span className="text-5xl">🦄</span>
          )}
        </div>
        <p className="mt-4 text-sm font-medium leading-relaxed text-app-gold">
          主人，灵丹不足啦，好饿饿~
        </p>
        <p className="mt-2 text-xs leading-relaxed text-app-muted">
          1 瓶灵丹可测算 5 次，人生K线、AI六爻、八字排盘、AI看相、问灵宠共用次数。
          {feature && <span className="mt-1 block text-app-accent">「{feature}」需要消耗 1 次灵丹</span>}
        </p>
        <p className="mt-2 text-[11px] text-app-muted">
          购买灵丹，或邀请好友注册得 {REFERRAL_GIFT_BAGS} 瓶（{REFERRAL_GIFT_BAGS * USES_PER_BAG} 次）
        </p>
        <button type="button" onClick={() => setBuyOpen(true)} className="app-btn mt-4 w-full">
          购买灵丹
        </button>
        <button
          type="button"
          onClick={() => setInviteOpen(true)}
          className="app-btn-outline mt-2 w-full"
        >
          邀请好友得灵丹
        </button>
        <button type="button" onClick={onClose} className="mt-3 w-full py-2 text-xs text-app-muted">
          稍后再说
        </button>
      </div>
    </div>
  );
}
