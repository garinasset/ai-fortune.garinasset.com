"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { PageBannerSlide } from "@/lib/page-banners";

const PageCarouselBanner = dynamic(() => import("@/components/PageCarouselBanner"), {
  ssr: false,
  loading: () => <div className="mb-3 h-[88px] animate-pulse rounded-xl bg-app-card/50" />,
});

/** 首屏优先渲染主内容，轮播图延后加载 */
export default function DeferredPageBanner({
  slides,
  className,
}: {
  slides: PageBannerSlide[];
  className?: string;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const win = window as Window & { requestIdleCallback?: (cb: () => void) => number };
    if (win.requestIdleCallback) {
      const id = win.requestIdleCallback(() => setShow(true));
      return () => {
        /* requestIdleCallback cancel not needed for one-shot */
        void id;
      };
    }
    const t = window.setTimeout(() => setShow(true), 120);
    return () => window.clearTimeout(t);
  }, []);

  if (!show) {
    return <div className={`h-[88px] animate-pulse rounded-xl bg-app-card/50 ${className ?? ""}`} />;
  }

  return <PageCarouselBanner slides={slides} className={className} />;
}
