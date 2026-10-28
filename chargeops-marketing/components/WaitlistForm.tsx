"use client";

import { useState, type FormEvent } from "react";
import { useTranslation } from "@/lib/i18n";

/**
 * No-backend waitlist capture. By design it does NOT pretend to register a real
 * account — the driver app handles real auth (Keycloak) on mobile. This just
 * records interest locally and shows a success state. To make it real later,
 * POST `email` to a form service (Formspree / Resend) or your API.
 */
export function WaitlistForm({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return;
    // Placeholder: swap for a real POST when a backend/form service is wired up.
    setDone(true);
  }

  if (done) {
    return (
      <p
        className="pill bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/20"
        role="status"
        aria-live="polite"
      >
        {t.download.waitlistSuccess}
      </p>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className={`flex flex-col sm:flex-row w-full gap-2 ${compact ? "max-w-md" : "max-w-lg"}`}
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t.download.waitlistPlaceholder}
        aria-label={t.download.waitlistPlaceholder}
        className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#121A16] px-4 py-3 text-sm text-white
          outline-none transition placeholder:text-white/40 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
      />
      <button
        type="submit"
        className="cursor-pointer rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-white px-5 py-3 text-sm font-bold shadow-glow-emerald transition-all duration-300 ease-haptic whitespace-nowrap"
      >
        {t.download.waitlistButton}
      </button>
    </form>
  );
}
