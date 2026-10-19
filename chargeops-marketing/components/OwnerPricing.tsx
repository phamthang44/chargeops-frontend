"use client";

import { useState } from "react";
import { CheckIcon, BoltIcon } from "@/components/Icons";
import { Reveal } from "./Reveal";

export function OwnerPricing() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");

  return (
    <section id="bang-gia-license" className="relative overflow-hidden py-16 sm:py-24 lg:py-32 bg-white border-t border-black/[0.05]">
      <div className="container-x">
        <Reveal className="text-center max-w-2xl mx-auto">
          <span className="eyebrow-tag">
            <BoltIcon className="h-3.5 w-3.5 text-primary" /> PHÍ BẢN QUYỀN HẠ TẦNG (LICENSE)
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ink-heading sm:text-4xl lg:text-5xl text-balance">
            Chọn thời hạn License phù hợp cho trạm
          </h2>
          <p className="mt-4 text-base sm:text-lg text-ink-body leading-relaxed">
            Các mức phí bên dưới để tham khảo. Giá và thời hạn áp dụng được xác nhận theo thông tin hệ thống khi đăng ký.
          </p>

          {/* Interactive Billing Frequency Switcher */}
          <div className="mt-8 flex w-full max-w-md flex-col items-stretch gap-1 rounded-2xl border border-black/10 bg-surface-alt p-1.5 shadow-sm sm:inline-flex sm:w-auto sm:flex-row sm:rounded-full sm:gap-2">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              aria-pressed={billingCycle === "monthly"}
              className={`min-h-11 cursor-pointer whitespace-nowrap rounded-xl px-3 py-2 text-xs sm:rounded-full sm:px-5 sm:text-sm font-semibold transition-all ${
                billingCycle === "monthly"
                  ? "bg-white text-ink-heading shadow-sm"
                  : "text-ink-muted hover:text-ink-heading"
              }`}
            >
              Gói theo tháng
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("yearly")}
              aria-pressed={billingCycle === "yearly"}
              className={`min-h-11 cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-xs sm:rounded-full sm:px-5 sm:text-sm font-bold transition-all ${
                billingCycle === "yearly"
                  ? "bg-primary text-white shadow-glow-emerald"
                  : "text-ink-muted hover:text-ink-heading"
              }`}
            >
              <span className="whitespace-nowrap">Gói theo năm</span>
              <span className={`whitespace-nowrap text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full ${
                billingCycle === "yearly" ? "bg-white/20 text-white" : "bg-emerald-100 text-primary-dark"
              }`}>
                Thời hạn 1 năm
              </span>
            </button>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-5 lg:mt-14 lg:grid-cols-2 lg:gap-8 max-w-4xl mx-auto items-stretch">
          {/* Monthly Plan */}
          <Reveal delay={80} className="order-2 flex lg:order-1">
            <div className={`double-bezel w-full flex flex-col justify-between transition-all duration-300 ${
              billingCycle === "monthly" ? "ring-2 ring-primary/40 shadow-diffusion" : "opacity-90"
            }`}>
              <div className="double-bezel-inner flex-1 flex flex-col justify-between !p-5 sm:!p-8">
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-ink-heading">Gói Tháng Linh Hoạt</h3>
                      <p className="text-xs text-ink-muted mt-0.5">Hiệu lực từng tháng lịch</p>
                    </div>
                    <span className="rounded-full bg-surface-alt border border-line px-3 py-1 text-xs font-semibold text-ink-body">
                      Mức tham khảo
                    </span>
                  </div>

                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-ink-heading font-mono">500.000</span>
                    <span className="text-base font-semibold text-ink-body">đ</span>
                    <span className="text-xs text-ink-muted">/ tháng / trạm</span>
                  </div>
                  <p className="mt-2 text-xs text-ink-muted leading-relaxed">
                    Phù hợp cho trạm sạc mới thử nghiệm thị trường và tối ưu dòng tiền ngắn hạn.
                  </p>

                  <div className="mt-7 border-t border-black/5 pt-6">
                    <p className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-3.5">
                      Quyền lợi bao gồm:
                    </p>
                    <ul className="space-y-3 text-xs sm:text-sm text-ink-body">
                      {[
                        "Quản lý thông tin trạm và cổng sạc",
                        "Cấu hình giá và khung giờ áp dụng",
                        "Theo dõi đặt chỗ và trạng thái check-in",
                        "Xem báo cáo trong Web Console",
                      ].map((feat) => (
                        <li key={feat} className="flex items-start gap-2.5">
                          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-dark">
                            <CheckIcon className="h-2.5 w-2.5" />
                          </span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-8 pt-4">
                  <a
                    href="mailto:phamthang3564@gmail.com?subject=Đăng ký Gói Tháng License Trạm sạc ChargeOps"
                    className="btn-island-secondary w-full justify-between text-xs py-2.5 pl-5 pr-2"
                  >
                    <span>Đăng ký Gói Tháng</span>
                    <span className="btn-icon-bubble">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-4 w-4">
                        <path d="M7 17L17 7M17 7H7M17 7V17" />
                      </svg>
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Yearly Plan - Best Value */}
          <Reveal delay={160} className="order-1 flex relative lg:order-2">
            <div className="double-bezel w-full flex flex-col justify-between ring-2 ring-primary/50 shadow-glow-emerald">
              <div className="double-bezel-inner flex-1 flex flex-col justify-between !p-5 sm:!p-8 border-primary/30">
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-ink-heading">Gói Năm</h3>
                      <p className="text-xs text-primary-dark font-semibold mt-0.5">Thời hạn gói: 1 năm</p>
                    </div>
                    <span className="rounded-full bg-primary-soft text-primary-dark px-3 py-1 text-xs font-bold border border-primary/30">
                      Khuyên dùng
                    </span>
                  </div>

                  <div className="mt-6 flex flex-col">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-extrabold text-primary-dark font-mono">5.000.000</span>
                      <span className="text-base font-semibold text-primary-dark">đ</span>
                      <span className="text-xs text-ink-muted">/ năm / trạm</span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-ink-muted leading-relaxed">
                    Mức phí tham khảo theo cấu hình hiện tại; khoản phí áp dụng được xác nhận từ hệ thống khi đăng ký.
                  </p>

                  <div className="mt-7 border-t border-black/5 pt-6">
                    <p className="text-xs font-bold uppercase tracking-wider text-primary-dark mb-3.5">
                      Toàn bộ quyền lợi Gói Tháng, cộng thêm:
                    </p>
                    <ul className="space-y-3 text-xs sm:text-sm text-ink-body">
                      {[
                        "Thời hạn sử dụng gói là 1 năm",
                        "Quản lý trạm, cổng sạc và giá trên Web Console",
                        "Theo dõi đặt chỗ và hoạt động được ghi nhận",
                      ].map((feat) => (
                        <li key={feat} className="flex items-start gap-2.5">
                          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                            <CheckIcon className="h-2.5 w-2.5" />
                          </span>
                          <span className="font-semibold text-ink-heading">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-8 pt-4">
                  <a
                    href="mailto:phamthang3564@gmail.com?subject=Đăng ký Gói Năm License Trạm sạc ChargeOps"
                    className="btn-island-primary w-full justify-between text-xs py-2.5 pl-5 pr-2"
                  >
                    <span>Đăng ký Gói Năm</span>
                    <span className="btn-icon-bubble">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-4 w-4">
                        <path d="M7 17L17 7M17 7H7M17 7V17" />
                      </svg>
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Commitment Note */}
        <Reveal delay={200} className="mt-12 max-w-2xl mx-auto rounded-2xl border border-black/5 bg-surface-alt p-4 text-center text-xs text-ink-muted">
          Mức phí trên trang là tham khảo. Giá và thời hạn áp dụng được xác nhận theo thông tin hệ thống khi đăng ký.
        </Reveal>
      </div>
    </section>
  );
}
