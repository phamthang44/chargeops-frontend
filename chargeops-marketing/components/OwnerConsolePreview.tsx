"use client";

import { useState } from "react";
import type { ComponentType, SVGProps } from "react";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n";
import { mediaAsset } from "@/lib/media";
import {
  ShieldCheckIcon,
  BoltIcon,
  SlidersIcon,
  SunIcon,
  MoonIcon,
} from "./Icons";

type ConsoleTab = "approvals" | "registration" | "pricing";

interface TabConfig {
  id: ConsoleTab;
  label: string;
  url: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

/**
 * Interactive preview of ChargeOps Web Console & Admin Management.
 * Features:
 * - Direct real-time browser address bar synchronization per active tab.
 * - Unified responsive module switch dock (Admin Approvals / Registration / Pricing).
 * - Light/Dark theme switcher with high-contrast, crystal-clear typography.
 * - Full-bleed edge-to-edge screen display without letterboxing (1600x900 16:9).
 */
export function OwnerConsolePreview() {
  const { locale } = useTranslation();
  const [activeTab, setActiveTab] = useState<ConsoleTab>("approvals");
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  const tabs: TabConfig[] = [
    {
      id: "approvals",
      label: locale === "vi" ? "Admin Duyệt trạm & License" : "Admin Station Approvals",
      url: "https://console.chargeops.online/admin/approvals",
      icon: ShieldCheckIcon,
    },
    {
      id: "registration",
      label: locale === "vi" ? "Owner Đăng ký trạm mới" : "Owner Station Registration",
      url: "https://console.chargeops.online/owner/register",
      icon: BoltIcon,
    },
    {
      id: "pricing",
      label: locale === "vi" ? "Cấu hình Giá & Trụ sạc" : "Pricing & Charging Ports",
      url: "https://console.chargeops.online/owner/pricing",
      icon: SlidersIcon,
    },
  ];

  const currentTab = tabs.find((t) => t.id === activeTab) || tabs[0];

  return (
    <div className="w-full">
      {/* Top Module Switcher Dock */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {/* Module Switcher Tabs */}
        <div className="inline-flex items-center gap-1 p-1 rounded-xl border border-emerald-500/20 bg-[#111A16]/95 shadow-sm overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm"
                    : "text-white/60 hover:text-white hover:bg-white/[0.04] border border-transparent"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-emerald-400" : "text-white/50"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Theme Switcher (only for pricing view) */}
        {activeTab === "pricing" && (
          <div className="inline-flex items-center gap-1 rounded-xl p-1 border border-emerald-500/20 bg-[#111A16]/95 shadow-sm animate-fade-in">
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer ${
                theme === "light"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-white/60 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <SunIcon className="h-3.5 w-3.5 shrink-0" />
              <span>{locale === "vi" ? "Sáng" : "Light"}</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer ${
                theme === "dark"
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm"
                  : "text-white/60 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <MoonIcon className="h-3.5 w-3.5 shrink-0" />
              <span>{locale === "vi" ? "Tối" : "Dark"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Browser Window Frame */}
      <div className="relative overflow-hidden rounded-[2rem] border border-emerald-500/25 bg-[#0E1512] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_35px_-5px_rgba(16,185,129,0.12)]">
        {/* Window Titlebar */}
        <div className="flex items-center justify-between border-b border-emerald-500/15 bg-[#090E0C] px-4 py-3 backdrop-blur">
          {/* macOS Traffic Lights */}
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#FF5F56] shadow-sm" />
            <span className="h-3 w-3 rounded-full bg-[#FFBD2E] shadow-sm" />
            <span className="h-3 w-3 rounded-full bg-[#27C93F] shadow-sm" />
          </div>

          {/* Address Bar */}
          <div className="mx-2 flex max-w-sm flex-1 items-center justify-center gap-2 rounded-lg border border-emerald-500/20 bg-[#121B16] px-3.5 py-1 text-[11px] font-medium text-white/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] sm:max-w-md">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="h-3 w-3 text-primary"
              aria-hidden="true"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span className="truncate font-mono text-[10.5px] text-emerald-400">
              {currentTab.url}
            </span>
          </div>

          {/* Right Status Indicator */}
          <div className="flex items-center gap-1.5 opacity-90">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden text-[10px] font-semibold uppercase tracking-wider text-emerald-400/90 sm:inline font-mono">
              LIVE
            </span>
          </div>
        </div>

        {/* Screen Display Frame */}
        <div className="relative aspect-[16/9] w-full select-none overflow-hidden bg-black/40">
          {activeTab === "approvals" && (
            <Image
              src={mediaAsset(`screens/admin-approvals-${locale === "vi" ? "vi" : "en"}.png`)}
              alt="Màn hình thẩm định hồ sơ và duyệt trạm của Admin ChargeOps"
              width={1600}
              height={900}
              priority
              className="h-full w-full object-cover transition-opacity duration-300 animate-fade-in"
            />
          )}

          {activeTab === "registration" && (
            <Image
              src={mediaAsset(`screens/owner-registration-${locale === "vi" ? "vi" : "en"}.png`)}
              alt="Màn hình đăng ký trạm sạc mới của Chủ trạm ChargeOps"
              width={1600}
              height={900}
              priority
              className="h-full w-full object-cover transition-opacity duration-300 animate-fade-in"
            />
          )}

          {activeTab === "pricing" && (
            <div className={`relative h-full w-full transition-colors duration-300 ${theme === "light" ? "bg-[#F6F7F9]" : "bg-[#0F1013]"}`}>
              <Image
                src={mediaAsset("screens/owner-pricing-light.png")}
                alt="Cấu hình biểu giá và giờ hoạt động (Giao diện sáng)"
                width={1600}
                height={900}
                priority
                className={`h-full w-full object-cover transition-opacity duration-300 ${
                  theme === "light" ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                }`}
              />
              <Image
                src={mediaAsset("screens/owner-pricing-dark.png")}
                alt="Cấu hình biểu giá và giờ hoạt động (Giao diện tối)"
                width={1600}
                height={900}
                priority
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
                  theme === "dark" ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                }`}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
