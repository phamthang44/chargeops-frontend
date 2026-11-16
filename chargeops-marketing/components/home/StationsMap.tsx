"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useInView } from "motion/react";
import type { Map as LeafletMap, LatLngBoundsExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { STATIONS } from "@/components/stations";
import { useLocale } from "@/lib/i18n";
import { DRIVER_DEMO_URL } from "@/lib/home/content";
import { AppIcon, CloseIcon, EASE_OUT, SearchIcon, useHomeCopy } from "./core";

const BOLT_SVG =
  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/></svg>';

/* Cities that have sample stations, in display order; the map opens on the first. */
const CITIES = Array.from(new Set(STATIONS.map((s) => s.city)));
const CITY_SHORT: Record<string, { vi: string; en: string }> = {
  "TP. Hồ Chí Minh": { vi: "TP.HCM", en: "HCMC" },
  "Hà Nội": { vi: "Hà Nội", en: "Hanoi" },
  "Đà Nẵng": { vi: "Đà Nẵng", en: "Da Nang" },
};
function cityBounds(city: string): LatLngBoundsExpression {
  const pts = STATIONS.filter((s) => s.city === city && s.latitude != null && s.longitude != null).map(
    (s) => [s.latitude as number, s.longitude as number] as [number, number],
  );
  return pts;
}

function esc(s: string) {
  return s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch] as string);
}

/**
 * Full-bleed station map (Leaflet + OpenStreetMap tiles) with the sample
 * stations from components/stations.ts, opened on the first city; the city
 * chips fly between cities. Wheel zoom is off so the page keeps
 * scrolling; one-finger drag is off on touch devices for the same reason.
 */
export function StationsMap() {
  const c = useHomeCopy();
  const wrapRef = useRef<HTMLElement>(null);
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const near = useInView(wrapRef, { margin: "300px 0px", once: true });
  const shown = useInView(wrapRef, { amount: 0.35, once: true });
  const [cardOpen, setCardOpen] = useState(true);
  const [city, setCity] = useState(CITIES[0]);
  const { locale } = useLocale();

  const fitOpts = () => {
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    return { padding: (mobile ? [48, 48] : [160, 160]) as [number, number], maxZoom: 13 };
  };
  const goCity = (name: string) => {
    setCity(name);
    mapRef.current?.flyToBounds(cityBounds(name), { ...fitOpts(), duration: 1.2 });
  };

  useEffect(() => {
    if (!near || !mapEl.current || mapRef.current) return;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapEl.current) return;
      const map = L.map(mapEl.current, {
        zoomControl: false,
        scrollWheelZoom: false,
        dragging: !L.Browser.mobile,
        attributionControl: true,
      });
      mapRef.current = map;
      map.attributionControl.setPrefix(false);
      // CARTO's keyless basemaps now answer with an "API key required" tile, so use OSM's
      // standard tiles (same source as the driver app) and soften them in CSS (.home-map).
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      STATIONS.forEach((s) => {
        if (s.latitude == null || s.longitude == null) return;
        const icon = L.divIcon({
          className: "",
          html: `<span class="co-pin ${s.fast ? "co-pin--fast" : ""}">${BOLT_SVG}</span>`,
          iconSize: [38, 38],
          iconAnchor: [19, 19],
          popupAnchor: [0, -20],
        });
        L.marker([s.latitude, s.longitude], { icon, title: s.name, keyboard: true })
          .addTo(map)
          .bindPopup(
            `<strong>${esc(s.name)}</strong><br/><span style="color:#3E5B53">${esc(s.address)}</span><br/>` +
              `<span>${s.available}/${s.total} ${esc(c.map.available)} · ${esc(s.pricePerKwh)}</span><br/>` +
              `<a href="/tram-sac/${encodeURIComponent(s.slug)}">${esc(c.map.viewStation)} →</a>`,
          );
      });
      map.fitBounds(cityBounds(CITIES[0]), fitOpts());
    })();
    return () => {
      cancelled = true;
    };
    // fitOpts is stable in behaviour (reads the viewport each call).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [near, c.map.available, c.map.viewStation]);

  useEffect(
    () => () => {
      mapRef.current?.remove();
      mapRef.current = null;
    },
    [],
  );

  const ctl =
    "grid h-10 w-10 place-items-center rounded-full bg-white text-hm-ink shadow-[0_8px_20px_-8px_rgba(11,43,36,0.4)] transition hover:bg-hm-mint";

  return (
    <section id="ban-do" ref={wrapRef} className="home-map relative isolate h-[640px] overflow-hidden bg-hm-mist md:h-[800px]">
      <div ref={mapEl} className="absolute inset-0 z-0" role="region" aria-label={c.map.search} />

      <div className="pointer-events-none absolute inset-x-4 top-4 z-[500] flex items-start justify-between">
        <Link href="/tram-sac" aria-label={c.map.search} className={`pointer-events-auto ${ctl}`}>
          <SearchIcon className="h-[18px] w-[18px]" />
        </Link>
        <div className="flex flex-col items-center gap-2">
          <div role="group" aria-label={c.map.cities} className="pointer-events-auto flex gap-1 rounded-full bg-white p-1 shadow-[0_8px_20px_-8px_rgba(11,43,36,0.4)]">
            {CITIES.map((name) => (
              <button
                key={name}
                type="button"
                aria-pressed={city === name}
                onClick={() => goCity(name)}
                className={`h-9 rounded-full px-3.5 text-[13px] font-medium transition md:px-4 md:text-sm ${
                  city === name ? "bg-hm-ink text-white" : "text-hm-ink hover:bg-hm-mint"
                }`}
              >
                {CITY_SHORT[name]?.[locale === "en" ? "en" : "vi"] ?? name}
              </button>
            ))}
          </div>
          <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-hm-body shadow-sm backdrop-blur">{c.map.badge}</span>
        </div>
        <div className="pointer-events-auto flex flex-col gap-2">
          <button type="button" className={ctl} aria-label={c.map.zoomIn} onClick={() => mapRef.current?.zoomIn()}>
            <span className="text-xl leading-none">+</span>
          </button>
          <button type="button" className={ctl} aria-label={c.map.zoomOut} onClick={() => mapRef.current?.zoomOut()}>
            <span className="text-xl leading-none">−</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {cardOpen && shown && (
          <motion.div
            key="card"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.8, ease: EASE_OUT }}
            className="absolute inset-x-0 bottom-6 z-[500] mx-auto flex w-[min(600px,calc(100%-32px))] items-center gap-3 rounded-[22px] bg-hm-ink/95 p-3 text-white shadow-[0_24px_50px_-20px_rgba(0,0,0,0.6)] backdrop-blur md:gap-4"
          >
            <AppIcon size={52} className="shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold">{c.map.cardTitle}</p>
              <p className="truncate text-[13px] text-white/70">{c.map.cardText}</p>
            </div>
            <a
              href={DRIVER_DEMO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden h-11 shrink-0 items-center rounded-full bg-white px-5 text-[15px] font-medium text-hm-ink transition hover:bg-hm-mint sm:inline-flex"
            >
              {c.map.cardCta}
            </a>
            <button
              type="button"
              onClick={() => setCardOpen(false)}
              aria-label={c.map.close}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
