"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import "@/app/home.css";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { HomeStateContext } from "./core";
import { FloatingQr, HomeHeader, MobileAppBar, VideoModal } from "./chrome";
import { HomeFooter } from "./HomeFooter";

/**
 * Light page frame shared by the pages around the home page: same header,
 * footer, smooth scroll, floating QR / app bar and language switcher, without
 * the home-only loader, announcement bar and promo.
 */
export function SubpageShell({ children }: { children: ReactNode }) {
  const [videoOpen, setVideoOpen] = useState(false);
  const lenis = useRef<Lenis | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const instance = new Lenis({ autoRaf: true, lerp: 0.1, anchors: false });
    lenis.current = instance;
    return () => {
      instance.destroy();
      lenis.current = null;
    };
  }, []);

  const state = useMemo(() => ({ introDone: true, lenis, openVideo: () => setVideoOpen(true) }), []);

  return (
    <HomeStateContext.Provider value={state}>
      <div className="home-root">
        <a href="#top" className="skip-link">
          <SkipLabel />
        </a>
        <HomeHeader />
        <main id="top" tabIndex={-1} className="outline-none">
          {children}
        </main>
        <HomeFooter />
        <FloatingQr />
        <LanguageSwitcher variant="floating" tone="light" className="home-lang" />
        <MobileAppBar />
        <VideoModal open={videoOpen} onClose={() => setVideoOpen(false)} />
      </div>
    </HomeStateContext.Provider>
  );
}

function SkipLabel() {
  const { t } = useTranslation();
  return <>{t.common.skipToContent}</>;
}
