"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n";
import { mediaAsset } from "@/lib/media";

type ConsoleTab = "approvals" | "registration" | "pricing";

/**
 * Interactive preview of ChargeOps Web Console & Admin Management.
 * Allows toggling between:
 * 1. Admin Station Approvals & License Verification
 * 2. Owner Station Registration Flow
 * 3. Owner Tariff & Operating Hours Configuration (Light/Dark mode)
 */
export function OwnerConsolePreview() {
  const { t, locale } = useTranslation();
  const [activeTab, setActiveTab] = useState<ConsoleTab>("approvals");
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  const tabLabels = {
    approvals: locale === "vi" ? "Admin Duyệt trạm & License" : "Admin Station Approvals",
    registration: locale === "vi" ? "Owner Đăng ký trạm mới" : "Owner Station Registration",
    pricing: locale === "vi" ? "Cấu hình Giá & Trụ sạc" : "Pricing & Charging Ports",
  };

  return (
    <div className="relative w-full overflow-hidden bg-[#0D1210] transition-colors duration-300">
      {/* Navigation Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#121A16] px-3 sm:px-4 py-2.5 text-xs">
        {/* Module Switcher Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("approvals")}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
              activeTab === "approvals"
                ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40 shadow-sm"
                : "text-white/60 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>{tabLabels.approvals}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("registration")}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
              activeTab === "registration"
                ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40 shadow-sm"
                : "text-white/60 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            <span>{tabLabels.registration}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("pricing")}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
              activeTab === "pricing"
                ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40 shadow-sm"
                : "text-white/60 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            <span>{tabLabels.pricing}</span>
          </button>
        </div>

        {/* Theme Switcher (only for pricing view) */}
        {activeTab === "pricing" && (
          <div className="flex items-center gap-1 rounded-full p-0.5 ring-1 ring-white/10 bg-white/[0.06]">
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition-all cursor-pointer ${
                theme === "light"
                  ? "bg-white text-ink-strong shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Light
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition-all cursor-pointer ${
                theme === "dark"
                  ? "bg-[#23242B] text-white shadow-sm ring-1 ring-white/20"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Dark
            </button>
          </div>
        )}
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
          <div className="relative h-full w-full flex items-center justify-center bg-[#17181D]">
            <Image
              src={mediaAsset("screens/owner-pricing-light.png")}
              alt="Cấu hình biểu giá và giờ hoạt động (Giao diện sáng)"
              fill
              className={`object-contain transition-opacity duration-300 ${
                theme === "light" ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
            />
            <Image
              src={mediaAsset("screens/owner-pricing-dark.png")}
              alt="Cấu hình biểu giá và giờ hoạt động (Giao diện tối)"
              fill
              className={`object-contain transition-opacity duration-300 ${
                theme === "dark" ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
            />
          </div>
        )}
      </div>
    </div>
  );
}
