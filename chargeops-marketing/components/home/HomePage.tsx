"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import "@/app/home.css";
import { useTranslation } from "@/lib/i18n";
import { HomeStateContext, useHomeCopy } from "./core";
import {
  AnnouncementBar,
  FloatingQr,
  HomeHeader,
  MobileAppBar,
  PageLoader,
  PromoModal,
  VideoModal,
} from "./chrome";
import {
  AboutSplit,
  AppDownload,
  BookingSplit,
  Faq,
  FeatureSlider,
  Gallery,
  GivingBack,
  Hero,
  PartnerBand,
  PlansBand,
  Statement,
  StatsShowcase,
  TechStrip,
} from "./sections";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { StationsMap } from "./StationsMap";
import { HomeFooter } from "./HomeFooter";

export function HomePage() {
  const [introDone, setIntroDone] = useState(false);
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

  const onIntroDone = useCallback(() => setIntroDone(true), []);
  const state = useMemo(() => ({ introDone, lenis, openVideo: () => setVideoOpen(true) }), [introDone]);

  return (
    <HomeStateContext.Provider value={state}>
      <noscript>
        <style>{`.home-loader{display:none!important}`}</style>
      </noscript>
      <div className="home-root">
        <a href="#top" className="skip-link">
          <SkipLabel />
        </a>
        <PageLoader onDone={onIntroDone} />
        <AnnouncementBar />
        <HomeHeader />
        <Body />
        <HomeFooter />
        <FloatingQr />
        <LanguageSwitcher variant="floating" tone="light" className="home-lang" />
        <MobileAppBar />
        <PromoModal />
        <VideoModal open={videoOpen} onClose={() => setVideoOpen(false)} />
      </div>
    </HomeStateContext.Provider>
  );
}

function SkipLabel() {
  const { t } = useTranslation();
  return <>{t.common.skipToContent}</>;
}

function Body() {
  const c = useHomeCopy();
  return (
    <main id="top" tabIndex={-1} className="outline-none">
      <Hero />
      <Statement illo="/home/illo-battery-hammock.webp" width={440} height={352} line1={c.intro.line1} line2={c.intro.line2} />
      <FeatureSlider />
      <Statement illo="/home/illo-map-pin.webp" width={440} height={373} line1={c.near.line1} line2={c.near.line2} />
      <StationsMap />
      <StatsShowcase />
      <BookingSplit />
      <AboutSplit />
      <PlansBand />
      <GivingBack />
      <AppDownload />
      <PartnerBand />
      <Gallery />
      <Faq />
      <TechStrip />
    </main>
  );
}
