/**
 * ChargeOps Motion Design System — Direction 2: Fluid Energy-Tech
 * Based on LottieFiles Motion Principles and Motion.dev Standards.
 * Designed for 120fps GPU-accelerated performance and accessibility.
 */

// 1. Signature Easing Curves
export const EASINGS = {
  // Smooth deceleration for entrances (80% of UI elements)
  decelerate: [0.16, 1, 0.3, 1] as const,
  // Accelerated curve for exits
  accelerate: [0.7, 0, 0.84, 0] as const,
  // Balanced curve for state switches
  standard: [0.25, 1, 0.5, 1] as const,
  // Kinetic snappy curve for micro-badges and tags
  snappy: [0.2, 0, 0, 1] as const,
};

// 2. Duration Palette (seconds for Motion.dev)
export const DURATIONS = {
  instant: 0.1,    // 100ms - Tooltips, micro-indicators
  quick: 0.18,     // 180ms - Button press, tab switches
  standard: 0.35,  // 350ms - Card reveals, popovers
  relaxed: 0.5,    // 500ms - Section transitions, modal slide
  theatrical: 0.75,// 750ms - Hero reveal, video theater
};

// 3. Spring Physics Configurations
export const SPRINGS = {
  // Tactile haptic feedback for buttons, cards, interactive pills
  haptic: {
    type: "spring" as const,
    stiffness: 380,
    damping: 24,
    mass: 0.8,
  },
  // Smooth, buoyant spring for phone mockup and floating badges
  buoyant: {
    type: "spring" as const,
    stiffness: 260,
    damping: 20,
    mass: 1,
  },
  // Snappy layout transition spring
  layout: {
    type: "spring" as const,
    stiffness: 420,
    damping: 30,
  },
};

// 4. Stagger Delays
export const STAGGERS = {
  tight: 0.06,  // 60ms between list items
  standard: 0.1,// 100ms between cards
  loose: 0.15,  // 150ms between major narrative blocks
};
