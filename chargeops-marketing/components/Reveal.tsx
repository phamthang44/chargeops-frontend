"use client";

import { type ReactNode } from "react";
import { MotionReveal } from "./MotionReveal";

/**
 * Reveal wrapper powered by Motion.dev for 120fps GPU-accelerated reveals.
 * Maintains backwards compatibility with all previous Reveal imports.
 */
export function Reveal({
  children,
  delay = 0,
  as = "div",
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  as?: "div" | "section" | "article" | "li" | "span";
  className?: string;
}) {
  return (
    <MotionReveal delay={delay} as={as} className={className}>
      {children}
    </MotionReveal>
  );
}
