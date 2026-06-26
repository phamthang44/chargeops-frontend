"use client";

import { useState, type FormEvent } from "react";

/**
 * No-backend waitlist capture. By design it does NOT pretend to register a real
 * account — the driver app handles real auth (Keycloak) on mobile. This just
 * records interest locally and shows a success state. To make it real later,
 * POST `email` to a form service (Formspree / Resend) or your API.
 */
export function WaitlistForm({ compact = false }: { compact?: boolean }) {
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
        className="pill bg-primary-soft text-primary-dark"
        role="status"
        aria-live="polite"
      >
        ✓ Cảm ơn bạn! Chúng tôi sẽ báo khi ứng dụng ra mắt.
      </p>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className={`flex w-full gap-2 ${compact ? "max-w-md" : "max-w-lg"}`}
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email của bạn"
        aria-label="Email"
        className="min-w-0 flex-1 rounded-xl border border-line bg-white px-4 py-3 text-sm
          outline-none transition placeholder:text-ink-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      <button type="submit" className="btn-primary whitespace-nowrap">
        Nhận thông báo
      </button>
    </form>
  );
}
