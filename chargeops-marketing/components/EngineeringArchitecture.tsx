"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { BoltIcon } from "./Icons";
import { Reveal } from "./Reveal";
import { SPRINGS } from "@/lib/motionTokens";
import { useTranslation } from "@/lib/i18n";

const CODE_SNIPPETS: Record<string, string> = {
  concurrency: `// Go Backend Lock Handler
func (s *BookingService) ReserveSlot(ctx context.Context, slotID string, userID string) error {
    lockKey := fmt.Sprintf("lock:slot:%s", slotID)
    acquired, err := s.redis.SetNX(ctx, lockKey, userID, 15*time.Second).Result()
    if err != nil || !acquired {
        return ErrSlotAlreadyLocked
    }
    defer s.redis.Del(ctx, lockKey)
    return s.repo.CreateBookingTx(ctx, slotID, userID)
}`,
  simulator: `// Charging Simulator State Transition
func (evse *Simulator) HandleMeterValues(session *Session) {
    for evse.IsCharging() {
        powerKW := CalculateDynamicCurve(evse.BatterySoC, evse.MaxKW)
        evse.WSStream.Broadcast(MeterValue{
            SoC:       evse.BatterySoC,
            PowerKW:   powerKW,
            VoltageV:  400.0,
            CurrentA:  powerKW * 1000 / 400.0,
        })
        time.Sleep(1 * time.Second)
    }
}`,
  security: `// Keycloak Token Verification Middleware
func VerifyKeycloakOIDC(c *fiber.Ctx) error {
    rawToken := extractBearer(c.Get("Authorization"))
    claims, err := oidcVerifier.Verify(c.Context(), rawToken)
    if err != nil {
        return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
    }
    c.Locals("user_role", claims.RealmAccess.Roles)
    return c.Next()
}`,
  testing: `// Test Concurrent Slot Reservation
func TestConcurrentBooking_ZeroDoubleBook(t *testing.T) {
    slotID := "slot-vincom-01"
    var successCount int64
    var wg sync.WaitGroup
    for i := 0; i < 50; i++ {
        wg.Add(1)
        go func(driverID int) {
            defer wg.Done()
            if err := svc.ReserveSlot(ctx, slotID, driverID); err == nil {
                atomic.AddInt64(&successCount, 1)
            }
        }(i)
    }
    wg.Wait()
    assert.Equal(t, int64(1), successCount) // Exactly ONE booking succeeds
}`,
};

export function EngineeringArchitecture() {
  const { t } = useTranslation();
  const [activeId, setActiveId] = useState<string>("concurrency");
  const shouldReduceMotion = useReducedMotion();

  const pillars = t.architecture.pillars;
  const activePillar = pillars.find((p) => p.id === activeId) || pillars[0];
  const activeCode = CODE_SNIPPETS[activePillar.id] || CODE_SNIPPETS.concurrency;

  return (
    <section id="kien-truc" className="py-20 sm:py-28 lg:py-36 bg-[#070A08] border-t border-white/[0.06] relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute top-1/4 -right-40 h-[500px] w-[500px] rounded-full bg-emerald-500/[0.04] blur-[140px]" />
      <div className="pointer-events-none absolute bottom-1/4 -left-40 h-[500px] w-[500px] rounded-full bg-primary-electric/[0.04] blur-[140px]" />

      <div className="container-x relative">
        <Reveal className="max-w-3xl mb-12 sm:mb-16">
          <span className="eyebrow-tag">
            <BoltIcon className="h-3.5 w-3.5 text-primary" /> {t.architecture.eyebrow}
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl leading-[1.25] sm:leading-[1.26] lg:leading-[1.28] text-balance">
            {t.architecture.titlePart1} <br className="hidden sm:inline" />
            <span className="text-gradient">{t.architecture.titleHighlight}</span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-white/70 leading-relaxed max-w-2xl">
            {t.architecture.description}
          </p>
        </Reveal>

        {/* 4 Interactive Architecture Selector Tabs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
          {pillars.map((p) => {
            const isSelected = p.id === activeId;
            return (
              <motion.button
                key={p.id}
                type="button"
                whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                transition={SPRINGS.haptic}
                onClick={() => setActiveId(p.id)}
                className={`min-h-11 cursor-pointer text-left p-4 sm:p-5 rounded-2xl border transition-colors duration-200 relative ${
                  isSelected
                    ? "border-emerald-500/50 bg-[#121A16] shadow-glow-emerald ring-1 ring-emerald-500/30"
                    : "border-white/10 bg-[#0E1512] hover:border-white/20 hover:bg-[#121A16]/60 text-white/70 hover:text-white"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                    isSelected ? "text-emerald-400" : "text-white/40"
                  }`}>
                    {p.badge}
                  </span>
                  {isSelected && (
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1">
                  {p.title}
                </h4>
              </motion.button>
            );
          })}
        </div>

        {/* Detailed Showcase Pane (Asymmetric Split: Explanation & Code Specification) */}
        <div className="rounded-[2rem] border border-white/10 bg-[#0B100D] p-6 sm:p-10 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85)]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePillar.id}
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
                transition={SPRINGS.layout}
                className="grid min-w-0 gap-8 items-center lg:grid-cols-12"
              >
                {/* Left Column: Narrative & Technical Metrics */}
                <div className="min-w-0 space-y-6 lg:col-span-6">
                  <div>
                    <span className="pill bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/20 text-xs">
                      {activePillar.badge}
                    </span>
                    <h3 className="mt-3 text-2xl sm:text-3xl font-extrabold text-white">
                      {activePillar.title}
                    </h3>
                    <p className="mt-1 text-sm font-mono text-emerald-400">
                      {activePillar.tagline}
                    </p>
                    <p className="mt-4 text-sm sm:text-base text-white/70 leading-relaxed">
                      {activePillar.description}
                    </p>
                  </div>

                  {/* Technical Specifications Grid */}
                  <div className="grid min-w-0 grid-cols-2 gap-3 pt-2">
                    {activePillar.specs.map((spec) => (
                      <div
                        key={spec.label}
                        className="min-w-0 space-y-0.5 rounded-xl border border-white/10 bg-[#121A16] p-3"
                      >
                        <p className="break-words text-[10px] uppercase font-mono tracking-wider text-white/40">
                          {spec.label}
                        </p>
                        <p className="break-words text-xs sm:text-sm font-bold text-white font-mono">
                          {spec.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Column: Verified Code Architecture Preview */}
                <div className="min-w-0 lg:col-span-6">
                  <div className="rounded-2xl border border-white/10 bg-[#070A08] overflow-hidden shadow-2xl">
                    {/* Terminal Header Bar */}
                    <div className="flex min-w-0 items-center gap-2 border-b border-white/10 bg-[#0E1512] px-3 py-2.5 sm:px-4">
                      <div className="flex shrink-0 items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F56]/80" />
                        <span className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]/80" />
                        <span className="h-2.5 w-2.5 rounded-full bg-[#27C93F]/80" />
                      </div>
                      <span className="min-w-0 flex-1 truncate text-center text-[10px] font-mono text-white/50 sm:text-[11px]">
                        chargeops-backend / internal / core
                      </span>
                      <span className="shrink-0 whitespace-nowrap text-[10px] font-mono text-emerald-400">Verified</span>
                    </div>

                    {/* Terminal Code Snippet */}
                    <div className="min-w-0 max-w-full overflow-x-auto overscroll-x-contain p-4 text-[11px] font-mono text-white/80 leading-relaxed sm:p-5 sm:text-xs">
                      <pre className="whitespace-pre-wrap break-words">
                        <code className="break-words">{activeCode}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>
  );
}
