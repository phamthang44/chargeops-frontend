"use client";

import { type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { EASINGS, DURATIONS } from "@/lib/motionTokens";

interface MotionRevealProps {
  children: ReactNode;
  delay?: number; // in milliseconds
  duration?: number; // in seconds
  yOffset?: number;
  className?: string;
  as?: "div" | "section" | "article" | "li" | "span";
}

/**
 * 120fps GPU-accelerated reveal component powered by Motion.dev.
 * Respects system prefers-reduced-motion settings.
 */
export function MotionReveal({
  children,
  delay = 0,
  duration = DURATIONS.relaxed,
  yOffset = 24,
  className = "",
  as = "div",
}: MotionRevealProps) {
  const shouldReduceMotion = useReducedMotion();
  const Component = motion[as] as typeof motion.div;

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <Component
      initial={{ opacity: 0, y: yOffset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration,
        delay: delay / 1000,
        ease: EASINGS.decelerate,
      }}
      className={className}
    >
      {children}
    </Component>
  );
}

/**
 * Interactive card wrapper with natural deceleration on enter and subtle lift on hover.
 */
export function MotionCard({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{
        duration: DURATIONS.standard,
        delay: delay / 1000,
        ease: EASINGS.decelerate,
      }}
      whileHover={
        shouldReduceMotion
          ? undefined
          : { y: -4, transition: { duration: 0.25, ease: EASINGS.decelerate } }
      }
      className={className}
    >
      {children}
    </motion.div>
  );
}
