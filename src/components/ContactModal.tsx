"use client";

import SupportChatPanel from "@/components/SupportChatPanel";

interface ContactModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ContactModal({ open, onClose }: ContactModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 p-3 pb-4 backdrop-blur-sm sm:items-center">
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <SupportChatPanel onClose={onClose} />
    </div>
  );
}
